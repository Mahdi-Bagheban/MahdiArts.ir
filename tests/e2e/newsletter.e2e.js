/* به نام خداوند بخشنده مهربان */

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

function createKV() {
  const store = new Map();
  return {
    put: async (key, val) => { store.set(key, val); },
    get: async (key) => store.get(key),
    delete: async (key) => { store.delete(key); },
    list: async ({ prefix } = {}) => {
      const keys = [];
      for (const k of store.keys()) {
        if (!prefix || String(k).startsWith(prefix)) keys.push({ name: k });
      }
      return { keys };
    }
  };
}

async function call(worker, path, body, headers) {
  const req = new Request('https://mahdiarts.ir' + path, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
    body: JSON.stringify(body || {})
  });
  const env = {
    TEST_MODE: 'true',
    NEWSLETTER_KV: createKV(),
    NEWSLETTER_PUBLISH_KEY: 'secret-publish',
    ADMIN_EMAIL: 'info@mahdiarts.ir',
    FROM_EMAIL: 'noreply@mahdiarts.ir',
    ALLOWED_ORIGINS: 'https://mahdiarts.ir,https://www.mahdiarts.ir'
  };
  const res = await worker.fetch(req, env);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { parseError: true, raw: text }; }
  return { status: res.status, data, env };
}

(async () => {
  const worker = (await import('../../workers/contact-form.js')).default;

  // Subscribe valid
  let r = await call(worker, '/api/newsletter/subscribe', { email: 'user@example.com', lang: 'de' });
  assert(r.status === 200 && r.data && r.data.success, 'Subscribe should succeed');
  const kvList1 = await r.env.NEWSLETTER_KV.list({ prefix: 'sub:' });
  assert(kvList1.keys.length === 1, 'KV should store 1 subscriber');

  // Subscribe invalid email
  r = await call(worker, '/api/newsletter/subscribe', { email: 'bad', lang: 'fa' });
  assert(r.status === 400 && r.data && r.data.success === false, 'Invalid email should fail');

  // Unsubscribe
  r = await call(worker, '/api/newsletter/unsubscribe', { email: 'user@example.com' });
  assert(r.status === 200 && r.data && r.data.success, 'Unsubscribe should succeed');
  const kvList2 = await r.env.NEWSLETTER_KV.list({ prefix: 'sub:' });
  assert(kvList2.keys.length === 0, 'KV should be empty after unsubscribe');

  // Bulk subscribe
  const env = { TEST_MODE: 'true', NEWSLETTER_KV: createKV(), NEWSLETTER_PUBLISH_KEY: 'secret-publish', FROM_EMAIL: 'noreply@mahdiarts.ir', ADMIN_EMAIL: 'info@mahdiarts.ir', ALLOWED_ORIGINS: 'https://mahdiarts.ir' };
  const workerFetch = worker.fetch.bind(worker);
  for (let i = 0; i < 100; i++) {
    const req = new Request('https://mahdiarts.ir/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `user${i}@example.com`, lang: i % 2 ? 'fa' : 'en' }) });
    await workerFetch(req, env);
  }
  const reqBadAuth = new Request('https://mahdiarts.ir/api/newsletter/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer wrong' }, body: JSON.stringify({ title: 'Test', summary: 'Summary', url: 'https://mahdiarts.ir/blog/test', lang: '' }) });
  let res = await workerFetch(reqBadAuth, env);
  assert(res.status === 401, 'Publish with wrong token should be unauthorized');

  const reqGood = new Request('https://mahdiarts.ir/api/newsletter/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer secret-publish' }, body: JSON.stringify({ title: 'Test', summary: 'Summary', url: 'https://mahdiarts.ir/blog/test', lang: '' }) });
  res = await workerFetch(reqGood, env);
  const bodyText = await res.text();
  const body = JSON.parse(bodyText);
  assert(res.status === 200 && body.success && body.sent === 100, 'Publish should send to all subscribers');

  console.log('E2E newsletter tests passed');
})();

