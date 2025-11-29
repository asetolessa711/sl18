const axios = require('axios');
const harness = require('./harness');
let TEST_PORT;

describe('SL18 backend extended E2E', () => {
  beforeAll(async () => {
    const { port } = await harness.start();
    TEST_PORT = port;
  }, 20000);
  afterAll(() => { harness.stop(); });

  test('docs list returns file collection', async () => {
    const res = await axios.get(`http://localhost:${TEST_PORT}/api/docs`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('files');
    expect(Array.isArray(res.data.files)).toBe(true);
  });

  test('docs content missing file param returns 400', async () => {
    let status;
    try { await axios.get(`http://localhost:${TEST_PORT}/api/docs/content`); } catch (e) { status = e.response && e.response.status; }
    expect(status).toBe(400);
  });

  test('docs content nonexistent returns 404', async () => {
    let status;
    try { await axios.get(`http://localhost:${TEST_PORT}/api/docs/content?file=__does_not_exist__.md`); } catch (e) { status = e.response && e.response.status; }
    expect(status).toBe(404);
  });

  test('credentials status returns alerts/credentials payload', async () => {
    const res = await axios.get(`http://localhost:${TEST_PORT}/api/credentials/status`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('credentials');
    expect(typeof res.data.credentials).toBe('object');
    expect(res.data).toHaveProperty('alerts');
    expect(Array.isArray(res.data.alerts)).toBe(true);
  });

  test('alerts endpoint returns structured list', async () => {
    const res = await axios.get(`http://localhost:${TEST_PORT}/api/alerts`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('alerts');
    expect(Array.isArray(res.data.alerts)).toBe(true);
    expect(res.data).toHaveProperty('counts');
    expect(typeof res.data.counts).toBe('object');
  });

  test('upload activity returns entries array', async () => {
    const res = await axios.get(`http://localhost:${TEST_PORT}/api/upload/activity`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('entries');
    expect(Array.isArray(res.data.entries)).toBe(true);
  });

  test('upload stats endpoint responds (200 with data or 500 w/out Airtable)', async () => {
    try {
      const res = await axios.get(`http://localhost:${TEST_PORT}/api/upload/stats`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('counts');
    } catch (e) {
      const status = e.response && e.response.status;
      expect(status).toBe(500);
    }
  });
});
