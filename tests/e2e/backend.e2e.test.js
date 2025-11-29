const axios = require('axios');
const harness = require('./harness');
let TEST_PORT;

describe('SL18 backend E2E', () => {
  beforeAll(async () => {
    const { port } = await harness.start();
    TEST_PORT = port;
  }, 20000);
  afterAll(() => { harness.stop(); });

  test('health endpoint returns ok', async () => {
    const res = await axios.get(`http://localhost:${TEST_PORT}/healthz`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('status', 'ok');
  });

  test('upload queue endpoint behaves based on Airtable credentials', async () => {
    try {
      const res = await axios.get(`http://localhost:${TEST_PORT}/api/upload/queue`);
      // If credentials exist, we expect a structured success payload
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('payloadVersion');
      expect(res.data).toHaveProperty('records');
      expect(Array.isArray(res.data.records)).toBe(true);
    } catch (err) {
      // Without credentials should be 500
      const status = err.response && err.response.status;
      expect(status).toBe(500);
    }
  });
});
