const path = require('path');
const { spawn } = require('child_process');

const backendDir = path.join(__dirname, '..', '..', 'apps', 'control-panel', 'backend');
const PORT = process.env.SL18_E2E_PORT ? Number(process.env.SL18_E2E_PORT) : 5188;

function buildBackend() {
  return new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { cwd: backendDir, shell: true });
    build.on('close', code => {
      if (code !== 0) return reject(new Error('Backend build failed code=' + code));
      resolve();
    });
    build.on('error', reject);
  });
}

function waitForOutput(child, match, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for output: ' + match)), timeoutMs);
    function handler(data) {
      const txt = data.toString();
      if (txt.includes(match)) {
        clearTimeout(timer);
        child.stdout.off('data', handler);
        child.stderr.off('data', handler);
        resolve();
      }
    }
    child.stdout.on('data', handler);
    child.stderr.on('data', handler);
  });
}

async function start() {
  if (global.__SL18_SERVER) {
    return { port: PORT };
  }
  if (!global.__SL18_SERVER_INIT) {
    global.__SL18_SERVER_INIT = (async () => {
      await buildBackend();
      const env = { ...process.env, NODE_ENV: 'e2e', SL18_PANEL_PORT: String(PORT) };
      delete env.AIRTABLE_API_KEY;
      delete env.AIRTABLE_BASE_ID;
      const proc = spawn('node', ['dist/server.js'], { cwd: backendDir, env });
      await waitForOutput(proc, 'backend listening');
      global.__SL18_SERVER = proc;
    })();
  }
  await global.__SL18_SERVER_INIT;
  return { port: PORT };
}

function stop() {
  const proc = global.__SL18_SERVER;
  if (proc) {
    proc.kill();
    delete global.__SL18_SERVER;
    delete global.__SL18_SERVER_INIT;
  }
}

module.exports = { start, stop };
