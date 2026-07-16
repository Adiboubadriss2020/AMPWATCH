/**
 * AMPWATCH — Minimal Webhook Relay Server
 * 
 * Flow:
 *   Workflow (Make/n8n) --POST /webhook--> this server (stores payload)
 *   Frontend            --GET  /payload --> this server (reads stored payload)
 * 
 * Start:  node server.cjs
 * Port:   3001 (configure via PORT env var)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from the Vite dev server (localhost:5173) and any origin in prod
app.use(cors());
app.use(express.json());

// In-memory store: only keep the last payload received
let latestPayload = null;
let receivedAt = null;

// ─── POST /webhook ───────────────────────────────────────────────────────────
// The workflow sends telemetry data here via HTTP POST.
// Configure your Make/n8n webhook to point to:  http://<your-ip>:3001/webhook
app.post('/webhook', (req, res) => {
  const body = req.body;

  // Ignore completely empty payloads
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
    return res.status(400).json({ error: 'Empty payload — ignored.' });
  }

  latestPayload = body;
  receivedAt = new Date().toISOString();

  console.log(`[${receivedAt}] Webhook received → machineId: ${body.machineId || '?'}, kw: ${body.kw ?? '?'}`);

  res.status(200).json({ ok: true, receivedAt });
});

// ─── GET /payload ─────────────────────────────────────────────────────────────
// The frontend polls this endpoint to get the latest stored payload.
// No trigger is sent to the workflow; this only reads what was already stored.
app.get('/payload', (req, res) => {
  if (!latestPayload) {
    return res.status(204).end(); // No content yet
  }
  res.json({ receivedAt, payload: latestPayload });
});

// ─── GET /health ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', hasPayload: !!latestPayload, receivedAt });
});

app.listen(PORT, () => {
  console.log(`AMPWATCH relay server running on http://localhost:${PORT}`);
  console.log(`  POST http://localhost:${PORT}/webhook  ← configure in your workflow`);
  console.log(`  GET  http://localhost:${PORT}/payload  ← frontend reads here`);
});
