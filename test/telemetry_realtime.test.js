const test = require('node:test');
const assert = require('node:assert/strict');
const { TelemetryClient } = require('../src/core/telemetry');

class FakeQuery {
  select() { return this; }
  gte() { return this; }
  order() { return this; }
  limit() { return Promise.resolve({ data: [], error: null }); }
}

class FakeChannel {
  constructor() { this.handler = null; }
  on(_event, _filter, handler) { this.handler = handler; return this; }
  subscribe(callback) { this.subscribeCallback = callback; queueMicrotask(() => callback('SUBSCRIBED')); return this; }
}

function fakeClientFactory() {
  const channel = new FakeChannel();
  const client = {
    channel: () => channel,
    from: () => new FakeQuery(),
    removeChannel: async () => {},
    __channel: channel,
  };
  fakeClientFactory.client = client;
  return client;
}

test('Supabase Realtime INSERT events update dashboard telemetry metrics', async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_KEY = 'test-key';

  try {
    const updates = [];
    const payloads = [];
    const client = new TelemetryClient(fakeClientFactory);
    await client.start((state) => updates.push(state), (payload) => payloads.push(payload));
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(client.state.status, 'live');
    assert.equal(client.state.metrics.totalEvents, 0);

    fakeClientFactory.client.__channel.handler({
      new: {
        id: 42,
        type: 'commit',
        received_at: new Date().toISOString(),
        commit_hash: 'abc123',
      },
    });

    assert.equal(client.state.status, 'live');
    assert.equal(client.state.metrics.totalEvents, 1);
    assert.equal(client.state.metrics.byType.commit, 1);
    assert.equal(client.state.metrics.latestEvent.commitHash, 'abc123');
    assert.equal(payloads.length, 1);
    assert.deepEqual(Object.keys(payloads[0]).sort(), ['commit_hash', 'id', 'received_at', 'type']);
    assert.ok(updates.some((state) => state.status === 'live'));
    await client.stop();
  } finally {
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_KEY;
    else process.env.SUPABASE_KEY = originalKey;
  }
});
