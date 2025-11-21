import { OAuth2Client } from 'google-auth-library';
import open from 'open';
import readline from 'node:readline';

// IMPORTANT:
// Do NOT hard-code real OAuth Client ID / Secret in this file.
// Provide them via environment variables or a local (ignored) JSON file.
// GitHub push protection will block commits containing real credentials.

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || 'REPLACE_ME_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || 'REPLACE_ME_CLIENT_SECRET';
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost';

if (CLIENT_ID.startsWith('REPLACE_ME') || CLIENT_SECRET.startsWith('REPLACE_ME')) {
  console.warn('\n[WARN] OAuth client ID/secret not set. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET before running.');
}

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

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

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

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
      console.error('\nError retrieving token:', error.message);
    }
    rl.close();
  });
}

getToken();