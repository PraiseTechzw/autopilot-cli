const test = require('node:test');
const assert = require('node:assert/strict');

const { buildMetrics, getSupabaseUrl, createTelemetryClient } = require('../src/core/telemetry');

test('telemetry metrics are derived from recent Supabase events', () => {
  const now = Date.now();
  const metrics = buildMetrics([
    { type: 'commit', receivedAt: new Date(now - 60_000).toISOString() },
    { type: 'push', receivedAt: new Date(now - 120_000).toISOString() },
    { type: 'old', receivedAt: new Date(now - 10 * 60_000).toISOString() },
  ], now);

  assert.equal(metrics.totalEvents, 2);
  assert.equal(metrics.eventsPerMinute, 0.4);
  assert.deepEqual(metrics.byType, { commit: 1, push: 1 });
});

test('telemetry normalizes a Supabase REST URL to its project URL', () => {
  const original = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = 'https://example.supabase.co/rest/v1/';
  assert.equal(getSupabaseUrl(), 'https://example.supabase.co');
  if (original === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = original;
});

test('telemetry reports an explicit unconfigured state without synthetic metrics', async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_KEY;
  const originalAnon = process.env.SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  const client = createTelemetryClient();
  let state;
  await client.start((next) => { state = next; });
  assert.equal(state.status, 'not_configured');
  assert.equal(state.metrics, null);
  assert.match(state.error, /SUPABASE_URL/);

  if (originalUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.SUPABASE_KEY;
  else process.env.SUPABASE_KEY = originalKey;
  if (originalAnon === undefined) delete process.env.SUPABASE_ANON_KEY;
  else process.env.SUPABASE_ANON_KEY = originalAnon;
  if (originalService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = originalService;
});
