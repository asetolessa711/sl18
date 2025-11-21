import { OAuth2Client } from 'google-auth-library';
import open from 'open';
import readline from 'node:readline';

// Obtain a YouTube OAuth refresh token using environment-provided client credentials.
// Required env vars: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET.
// Optional: GOOGLE_OAUTH_REDIRECT_URI (defaults to http://localhost)

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost';

if (!clientId || !clientSecret) {
  console.error('[auth] Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET in environment.');
  console.error('Set them locally (e.g. .env.local) and retry.');
  process.exit(1);
}

const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
const scopes = ['https://www.googleapis.com/auth/youtube.upload'];

async function getToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  console.log('\nAuthorize this app by visiting this URL:\n');
  console.log(authUrl);
  await open(authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('\nEnter the code from the browser: ', async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code.trim());
      if (tokens.refresh_token) {
        console.log('\nRefresh Token (store in .env as YOUTUBE_REFRESH_TOKEN):\n');
        console.log(tokens.refresh_token);
      } else {
        console.log('\nNo refresh token returned. Ensure you used prompt=consent and access_type=offline.');
      }
    } catch (error) {
      const msg = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
      console.error('\nError retrieving token:', msg);
    }
    rl.close();
  });
}

getToken();
