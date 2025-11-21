// YouTube OAuth smoke: uses refresh token to call channels?mine=true
// Usage:
//   node -r dotenv/config scripts/smoke_tests/youtube_oauth_ping.mjs
// Env required:
//   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
// Output prefixes: OK • / WARN • / ERR •

import axios from 'axios';

function getenv(k) {
  return (process.env[k] || '').trim();
}

async function main() {
  const clientId = getenv('YOUTUBE_CLIENT_ID');
  const clientSecret = getenv('YOUTUBE_CLIENT_SECRET');
  const refreshToken = getenv('YOUTUBE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('ERR • YouTube OAuth • missing YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN');
    process.exitCode = 1;
    return;
  }

  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }), { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const accessToken = tokenRes.data && tokenRes.data.access_token;
    const scope = tokenRes.data && tokenRes.data.scope;
    if (!accessToken) {
      console.log('ERR • YouTube OAuth • no access_token in response');
      process.exitCode = 1;
      return;
    }

    const yt = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', mine: 'true' },
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15000,
    });

    const items = (yt.data && yt.data.items) || [];
    if (!items.length) {
      console.log('ERR • YouTube OAuth • mine=true returned no channels');
      process.exitCode = 1;
      return;
    }
    const ch = items[0];
    const title = ch && ch.snippet && ch.snippet.title || 'unknown';
    const id = ch && ch.id || 'unknown';
    const scopeInfo = scope ? ` scope="${scope}"` : '';
    console.log(`OK • YouTube OAuth • channel=${title} id=${id}${scopeInfo}`);
  } catch (err) {
    if (err.response) {
      const data = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : String(err.response.data);
      console.log(`ERR • YouTube OAuth • ${err.response.status} ${err.response.statusText}`);
      console.log(data);
    } else {
      console.log(`ERR • YouTube OAuth • ${err.message}`);
    }
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
