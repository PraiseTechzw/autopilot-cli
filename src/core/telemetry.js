const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');

const WINDOW_MS = 5 * 60 * 1000;
const MAX_EVENTS = 200;
const DEFAULT_ALERT_THRESHOLDS = { eventsPerMinute: 20, totalEvents: 100 };

function getSupabaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
}

function getSupabaseUrl() {
  return String(process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
}

function normalizeEvent(row) {
  return {
    id: row.id,
    type: row.type || 'unknown',
    receivedAt: row.received_at || (row.timestamp ? new Date(Number(row.timestamp)).toISOString() : null),
    commitHash: row.commit_hash || null,
  };
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatTelemetryCsv(events) {
  const headers = ['id', 'type', 'received_at', 'commit_hash'];
  return [headers.join(','), ...events.map((event) => [event.id, event.type, event.receivedAt, event.commitHash].map(csvEscape).join(','))].join('\n') + '\n';
}

async function exportTelemetryEvents(filePath, events, format = 'json') {
  const output = format.toLowerCase() === 'csv'
    ? formatTelemetryCsv(events)
    : JSON.stringify(events, null, 2) + '\n';
  await fs.ensureFile(filePath);
  await fs.writeFile(filePath, output, 'utf8');
  return { filePath, format: format.toLowerCase() === 'csv' ? 'csv' : 'json', count: events.length };
}

function evaluateAlerts(metrics, thresholds = DEFAULT_ALERT_THRESHOLDS) {
  const alerts = [];
  if (Number.isFinite(Number(thresholds.eventsPerMinute)) && metrics.eventsPerMinute > Number(thresholds.eventsPerMinute)) {
    alerts.push({ key: 'eventsPerMinute', message: `Event rate ${metrics.eventsPerMinute}/min exceeds ${thresholds.eventsPerMinute}/min` });
  }
  if (Number.isFinite(Number(thresholds.totalEvents)) && metrics.totalEvents > Number(thresholds.totalEvents)) {
    alerts.push({ key: 'totalEvents', message: `${metrics.totalEvents} events in ${metrics.windowMinutes}m exceeds ${thresholds.totalEvents}` });
  }
  return alerts;
}

function buildMetrics(events, now = Date.now()) {
  const recent = events.filter((event) => {
    const timestamp = Date.parse(event.receivedAt || '');
    return Number.isFinite(timestamp) && now - timestamp <= WINDOW_MS;
  });

  const byType = recent.reduce((result, event) => {
    result[event.type] = (result[event.type] || 0) + 1;
    return result;
  }, {});

  return {
    totalEvents: recent.length,
    eventsPerMinute: Number((recent.length / 5).toFixed(1)),
    latestEvent: recent[0] || null,
    byType,
    windowMinutes: 5,
  };
}

class TelemetryClient {
  constructor(clientFactory = createClient, thresholds = DEFAULT_ALERT_THRESHOLDS) {
    this.clientFactory = clientFactory;
    this.thresholds = { ...DEFAULT_ALERT_THRESHOLDS, ...(thresholds || {}) };
    this.client = null;
    this.channel = null;
    this.events = [];
    this.onUpdate = null;
    this.onEvent = null;
    this.state = {
      status: 'not_configured',
      metrics: null,
      alerts: [],
      error: null,
      source: 'Supabase Realtime / public.events',
    };
  }

  isConfigured() {
    return Boolean(getSupabaseUrl() && getSupabaseKey());
  }

  emit() {
    if (this.onUpdate) this.onUpdate({ ...this.state });
  }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  async start(onUpdate, onEvent) {
    this.onUpdate = onUpdate;
    this.onEvent = onEvent;
    if (!this.isConfigured()) {
      this.setState({ status: 'not_configured', metrics: null, alerts: [], error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or SUPABASE_KEY are required' });
      return;
    }

    this.client = this.clientFactory(getSupabaseUrl(), getSupabaseKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });

    this.setState({ status: 'connecting', error: null });

    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { data, error } = await this.client
      .from('events')
      .select('id,type,received_at,timestamp,commit_hash')
      .gte('received_at', since)
      .order('received_at', { ascending: false })
      .limit(MAX_EVENTS);

    if (error) {
      this.setState({ status: 'error', metrics: null, alerts: [], error: `Supabase query failed: ${error.message}` });
      return;
    }

    this.events = (data || []).map(normalizeEvent);
    const metrics = buildMetrics(this.events);
    this.setState({ status: 'connected', metrics, alerts: evaluateAlerts(metrics, this.thresholds), error: null });

    this.channel = this.client
      .channel('autopilot-dashboard-telemetry')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
        if (this.onEvent) this.onEvent(payload.new);
        this.events = [normalizeEvent(payload.new), ...this.events].slice(0, MAX_EVENTS);
        const metrics = buildMetrics(this.events);
        this.setState({ status: 'live', metrics, alerts: evaluateAlerts(metrics, this.thresholds), error: null });
      })
      .subscribe((status, errorObject) => {
        if (status === 'SUBSCRIBED') {
          this.setState({ status: 'live', error: null });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.setState({ status: 'error', error: `Supabase Realtime ${status.toLowerCase().replace('_', ' ')}` });
        } else if (errorObject) {
          this.setState({ status: 'error', error: errorObject.message || String(errorObject) });
        }
      });
  }

  async exportSnapshot(filePath, format = 'json') {
    return exportTelemetryEvents(filePath, this.events, format);
  }

  async stop() {
    if (this.client && this.channel) {
      await this.client.removeChannel(this.channel);
    }
    this.channel = null;
    this.client = null;
  }
}

function createTelemetryClient(clientFactory, thresholds) {
  return new TelemetryClient(clientFactory, thresholds);
}

module.exports = { TelemetryClient, createTelemetryClient, buildMetrics, evaluateAlerts, getSupabaseUrl, exportTelemetryEvents, formatTelemetryCsv, DEFAULT_ALERT_THRESHOLDS };
