import json
import os
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Lists files in a Drive folder using a service account
# Requires: pip install google-api-python-client google-auth

SERVICE_JSON = Path("config/google_service_account.json")
FOLDER_ID = os.getenv("GOOGLE_DRIVE_PARENT_ID", "")

if not SERVICE_JSON.exists():
    raise SystemExit("Missing config/google_service_account.json")
if not FOLDER_ID:
    raise SystemExit("Set GOOGLE_DRIVE_PARENT_ID in .env")

creds = service_account.Credentials.from_service_account_file(str(SERVICE_JSON), scopes=["https://www.googleapis.com/auth/drive"])
svc = build('drive', 'v3', credentials=creds)

q = f"'{FOLDER_ID}' in parents and trashed = false"
resp = svc.files().list(q=q, pageSize=10, fields="files(id, name, mimeType)").execute()
for f in resp.get('files', []):
    print(f"{f['name']}\t{f['id']}\t{f['mimeType']}")
