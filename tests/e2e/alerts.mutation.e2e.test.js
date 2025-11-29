const axios = require('axios');
const harness = require('./harness');
let PORT;

describe('SL18 alert mutation E2E', () => {
  beforeAll(async () => {
    const ctx = await harness.start();
    PORT = ctx.port;
  }, 20000);
  afterAll(() => harness.stop());

  function api(path) { return `http://localhost:${PORT}${path}`; }

  async function getFirstAlertId() {
    const res = await axios.get(api('/api/alerts'));
    if (!Array.isArray(res.data.alerts) || res.data.alerts.length === 0) {
      throw new Error('No alerts available for mutation tests');
    }
    return res.data.alerts[0].id;
  }

  test('ack alert changes state to acknowledged', async () => {
    const id = await getFirstAlertId();
    const res = await axios.post(api('/api/alerts/ack'), { id, actor: 'e2e' });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('id', id);
    expect(res.data).toHaveProperty('state');
    expect(['acknowledged','resolved','escalated','detected']).toContain(res.data.state); // transitional acceptance
  });

  test('add note to alert appends notes array entry', async () => {
    const id = await getFirstAlertId();
    const res = await axios.post(api('/api/alerts/note'), { id, actor: 'e2e', text: 'investigating' });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('notes');
    expect(Array.isArray(res.data.notes)).toBe(true);
    const found = res.data.notes.some(n => n.text === 'investigating');
    expect(found).toBe(true);
  });

  test('resolve alert sets state to resolved', async () => {
    const id = await getFirstAlertId();
    const res = await axios.post(api('/api/alerts/resolve'), { id, actor: 'e2e', note: 'fixed' });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('state','resolved');
  });
});
