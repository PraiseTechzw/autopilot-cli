const path = require('node:path');
const fs = require('fs-extra');
const { createTelemetryClient } = require('../core/telemetry');

async function telemetryCommand(action = 'export', options = {}) {
  if (action !== 'export') {
    throw new Error('Unknown telemetry action. Use: autopilot telemetry export');
  }

  const format = options.format === 'csv' ? 'csv' : 'json';
  const output = options.output || path.join(process.cwd(), `autopilot-telemetry.${format}`);
  const client = createTelemetryClient();

  try {
    await client.start(() => {});
    if (client.state.status === 'error' || client.state.status === 'not_configured') {
      throw new Error(client.state.error || 'Supabase telemetry is unavailable');
    }
    const result = await client.exportSnapshot(output, format);
    console.log(JSON.stringify({ ...result, source: client.state.source }));
    return result;
  } finally {
    await client.stop();
  }
}

module.exports = telemetryCommand;
