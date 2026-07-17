/**
 * EnerGenius / AMPWATCH — Webhook Relay Server
 *
 * Flow:
 *   Telemetry workflow --POST /webhook--> store latest machine payload
 *   Frontend           --GET  /payload --> read telemetry
 *   Agent workflow     --POST /agent  --> store AI recommendation (any JSON)
 *   Frontend           --GET  /agent  --> read latest agent payload
 *
 * Start:  node server.cjs
 * Port:   3001 (configure via PORT env var)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.text({ type: ['text/*', 'application/json'], limit: '2mb' }));

// ── Telemetry store ───────────────────────────────────────────────────────────
let latestPayload = null;
let receivedAt = null;

// ── Agent store (raw body + optional normalized graph) ────────────────────────
let latestAgent = null;
let agentReceivedAt = null;

function isEmptyBody(body) {
  if (body == null) return true;
  if (typeof body === 'string') return body.trim().length === 0;
  if (typeof body === 'object') return Object.keys(body).length === 0;
  return false;
}

function parseMaybeJson(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return { text: body };
    }
  }
  return body;
}

/**
 * Accept ANY agent JSON shape from Fusion/Make.
 * If nodes/edges exist, expose them; otherwise keep the raw body as `data`.
 */
function normalizeAgentBody(rawBody) {
  const body = parseMaybeJson(rawBody);
  const src =
    body && typeof body === 'object' && body.payload && typeof body.payload === 'object'
      ? body.payload
      : body;

  const nodes = Array.isArray(src?.nodes)
    ? src.nodes
    : Array.isArray(body?.nodes)
      ? body.nodes
      : Array.isArray(src?.recommendation?.nodes)
        ? src.recommendation.nodes
        : [];

  const edges = Array.isArray(src?.edges)
    ? src.edges
    : Array.isArray(body?.edges)
      ? body.edges
      : Array.isArray(src?.recommendation?.edges)
        ? src.recommendation.edges
        : [];

  const machineId = String(
    src?.machineId || body?.machineId || src?.recommendation?.machineId || 'COMP-01',
  );

  return {
    machineId,
    nodes,
    edges,
    hasGraph: nodes.length > 0,
    meta: {
      label: src?.label || body?.label || null,
      summary: src?.summary || body?.summary || src?.message || body?.message || null,
    },
    // Always keep original so the dashboard can display the full API JSON
    data: body,
  };
}

// ─── POST /webhook — telemetry from Make/n8n / IoT pipeline ───────────────────
app.post('/webhook', (req, res) => {
  const body = parseMaybeJson(req.body);

  if (isEmptyBody(body)) {
    return res.status(400).json({ error: 'Empty payload — ignored.' });
  }

  latestPayload = body;
  receivedAt = new Date().toISOString();

  console.log(
    `[${receivedAt}] Webhook received → machineId: ${body.machineId || '?'}, kw: ${body.kw ?? '?'}`,
  );

  res.status(200).json({ ok: true, receivedAt });
});

// ─── GET /payload — frontend polls telemetry ──────────────────────────────────
app.get('/payload', (req, res) => {
  if (!latestPayload) {
    return res.status(204).end();
  }
  res.json({ receivedAt, payload: latestPayload });
});

// ─── POST /agent — AI agent recommendation (accepts ANY JSON) ─────────────────
app.post('/agent', (req, res) => {
  const body = parseMaybeJson(req.body);

  if (isEmptyBody(body)) {
    return res.status(400).json({ error: 'Empty agent payload — ignored.' });
  }

  const normalized = normalizeAgentBody(body);
  latestAgent = normalized;
  agentReceivedAt = new Date().toISOString();

  console.log(`[${agentReceivedAt}] Agent received → keys: ${Object.keys(body).join(', ') || '(none)'}`);
  console.log('[agent] full POST body', JSON.stringify(body, null, 2));

  res.status(200).json({
    ok: true,
    receivedAt: agentReceivedAt,
    machineId: normalized.machineId,
    hasGraph: normalized.hasGraph,
    nodeCount: normalized.nodes.length,
  });
});

// ─── GET /agent — frontend polls latest agent recommendation ──────────────────
app.get('/agent', (req, res) => {
  if (!latestAgent) {
    return res.status(204).end();
  }
  // Same shape as /payload: receivedAt + payload (exact body Fusion posted)
  res.json({
    receivedAt: agentReceivedAt,
    payload: latestAgent.data,
    recommendation: latestAgent,
  });
});

// ─── GET /health ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasPayload: !!latestPayload,
    receivedAt,
    hasAgent: !!latestAgent,
    agentReceivedAt,
  });
});

// ─── POST /clear — wipe in-memory stores (no cache; wait for next API POSTs) ──
app.post('/clear', (_req, res) => {
  latestPayload = null;
  receivedAt = null;
  latestAgent = null;
  agentReceivedAt = null;
  console.log(`[${new Date().toISOString()}] Stores cleared — waiting for next /webhook and /agent`);
  res.json({ ok: true, cleared: true });
});

app.listen(PORT, () => {
  console.log(`EnerGenius relay server running on http://localhost:${PORT}`);
  console.log(`  POST http://localhost:${PORT}/webhook  ← telemetry in`);
  console.log(`  GET  http://localhost:${PORT}/payload  ← telemetry out`);
  console.log(`  POST http://localhost:${PORT}/agent    ← agent recommendations in (any JSON)`);
  console.log(`  GET  http://localhost:${PORT}/agent    ← agent recommendations out`);
  console.log(`  POST http://localhost:${PORT}/clear    ← wipe stores`);
});
