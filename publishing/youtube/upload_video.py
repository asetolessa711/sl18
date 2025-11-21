import os
import json
import sys
import importlib
from pathlib import Path

# Third-party: google-api-python-client, google-auth-oauthlib, python-dotenv
try:
    _dotenv = importlib.import_module('dotenv')
    load_dotenv = getattr(_dotenv, 'load_dotenv')
except ImportError:  # pragma: no cover - runtime guard
    def load_dotenv(*_args, **_kwargs):  # type: ignore
        return False

# Lazy imports to avoid hard failure if libs not installed yet
build = None
MediaFileUpload = None
InstalledAppFlow = None
Request = None
Credentials = None

try:  # pragma: no cover - optional dependency
    _ga_discovery = importlib.import_module('googleapiclient.discovery')
    _ga_http = importlib.import_module('googleapiclient.http')
    _ga_flow = importlib.import_module('google_auth_oauthlib.flow')
    _ga_transport = importlib.import_module('google.auth.transport.requests')
    _ga_credentials = importlib.import_module('google.oauth2.credentials')

    build = getattr(_ga_discovery, 'build', None)
    MediaFileUpload = getattr(_ga_http, 'MediaFileUpload', None)
    InstalledAppFlow = getattr(_ga_flow, 'InstalledAppFlow', None)
    Request = getattr(_ga_transport, 'Request', None)
    Credentials = getattr(_ga_credentials, 'Credentials', None)
except ImportError:  # pragma: no cover - runtime guard
    pass

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
BASE = Path(__file__).resolve().parent
ROOT = BASE.parent.parent

load_dotenv(dotenv_path=ROOT / ".env")

# Note: YouTube uploads require OAuth user consent, not API key or service account
CLIENT_SECRETS = ROOT / "config" / "youtube_client_secret.json"  # Place your OAuth client here
TOKEN_FILE = BASE / "token.json"  # Will be created on first auth


def get_youtube_client():
    if not CLIENT_SECRETS.exists():
        print(
            "Missing OAuth client secrets at config/youtube_client_secret.json.\n"
            "Create an OAuth client (Desktop) in Google Cloud and save JSON there."
        )
        sys.exit(1)
    creds = None
    if Credentials is None or Request is None or InstalledAppFlow is None:
        print("Missing Google API client libraries. Install: pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 python-dotenv")
        sys.exit(1)

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    return build('youtube', 'v3', credentials=creds)


def load_metadata():
    meta_path = BASE / 'metadata.json'
    if not meta_path.exists():
        return {}
    try:
        with open(meta_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as err:
        print(f"Warning: metadata.json is not valid JSON ({err}). Using defaults.")
        return {}


def upload(video_path: str):
    if build is None:
        print("Missing dependencies. Install: pip install google-api-python-client google-auth-oauthlib google-auth-httplib2 python-dotenv")
        sys.exit(1)

    video = Path(video_path)
    if not video.exists():
        print(f"Video file not found: {video}")
        sys.exit(1)

    meta = load_metadata()
    youtube = get_youtube_client()

    body = {
        'snippet': {
            'title': meta.get('title', video.stem),
            'description': meta.get('description', ''),
            'tags': meta.get('tags', []),
            'categoryId': meta.get('categoryId', '22')
        },
        'status': {
            'privacyStatus': meta.get('privacyStatus', 'private')
        }
    }

    media = MediaFileUpload(str(video), chunksize=-1, resumable=True, mimetype='video/*')
    request = youtube.videos().insert(part=','.join(body.keys()), body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status and status.progress():
            print(f"Uploaded {int(status.progress() * 100)}%")

    video_id = response.get('id')
    print(f"Upload complete. Video ID: {video_id}")

    # Optional: set thumbnail if provided
    thumb_dir = BASE / 'thumbnails'
    if thumb_dir.exists():
        thumbs = sorted([p for p in thumb_dir.iterdir() if p.suffix.lower() in ['.jpg', '.jpeg', '.png']])
        if thumbs:
            youtube.thumbnails().set(videoId=video_id, media_body=str(thumbs[0])).execute()
            print(f"Thumbnail set: {thumbs[0].name}")

    # Optional: add to playlist
    playlist_id = meta.get('playlistId')
    if playlist_id:
        youtube.playlistItems().insert(
            part='snippet',
            body={'snippet': {'playlistId': playlist_id, 'resourceId': {'kind': 'youtube#video', 'videoId': video_id}}}
        ).execute()
        print(f"Added to playlist: {playlist_id}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python publishing/youtube/upload_video.py <path_to_video>")
        sys.exit(1)
    upload(sys.argv[1])
