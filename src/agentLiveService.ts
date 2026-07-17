import type { AgentEdge, AgentInsight, AgentNode } from './types';

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/agent`;
const POLL_MS = 4000;

export type AgentApiRecommendation = {
  machineId: string;
  nodes: AgentNode[];
  edges: AgentEdge[];
  hasGraph?: boolean;
  meta?: { label?: string | null; summary?: string | null };
  /** Original Fusion/Make body */
  data?: unknown;
  insight: AgentInsight | null;
};

type AgentApiBody = {
  receivedAt: string;
  payload: unknown;
  recommendation: AgentApiRecommendation;
};

type Listener = (state: {
  live: boolean;
  receivedAt: string | null;
  recommendation: AgentApiRecommendation | null;
  /** Full GET /agent response — same idea as webhook { receivedAt, payload } */
  rawResponse: AgentApiBody | null;
}) => void;

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function asText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
}

/** Parse Fusion anomaly-advice payload into a structured insight. */
export function parseAgentInsight(data: unknown): AgentInsight | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;

  const diagnostic = asText(d.diagnostic);
  const actionImmediate = asText(d.action_immediate);
  const hitl = asText(d.recommandation_hitl);
  const score = asNumber(d.score_risque);

  // Require at least one strong signal so empty/test pings don't flood the panel
  if (!diagnostic && !actionImmediate && !hitl && score == null) return null;

  return {
    diagnostic,
    cause_probable: asText(d.cause_probable),
    risque_panne: asText(d.risque_panne),
    score_risque: score,
    action_immediate: actionImmediate,
    action_planifiee: asText(d.action_planifiee),
    conseil_economie: asText(d.conseil_economie),
    impact_co2: asText(d.impact_co2),
    perte_estimee_jour: asNumber(d.perte_estimee_jour),
    prediction_panne_jours: asNumber(d.prediction_panne_jours),
    recommandation_hitl: hitl,
  };
}

function extractMachineId(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    if (typeof d.machineId === 'string' && d.machineId.trim()) return d.machineId.trim();
    const hay = `${d.diagnostic ?? ''} ${d.recommandation_hitl ?? ''}`;
    const m = hay.match(/\b(COMP-\d+)\b/i);
    if (m) return m[1].toUpperCase();
  }
  return fallback;
}

class AgentLiveService {
  private live = false;
  private receivedAt: string | null = null;
  private recommendation: AgentApiRecommendation | null = null;
  private rawResponse: AgentApiBody | null = null;
  private lastReceivedAt: string | null = null;
  private listeners = new Set<Listener>();
  private pollId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.pollId) return;
    void this.poll();
    this.pollId = setInterval(() => void this.poll(), POLL_MS);
  }

  stop() {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  reset() {
    const dirty = this.live || this.recommendation != null || this.rawResponse != null;
    this.live = false;
    this.receivedAt = null;
    this.recommendation = null;
    this.rawResponse = null;
    this.lastReceivedAt = null;
    if (dirty) this.emit();
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    cb(this.snapshot());
    // Do not auto-start — App gates polling via Start/Stop Production
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) this.stop();
    };
  }

  private snapshot() {
    return {
      live: this.live,
      receivedAt: this.receivedAt,
      recommendation: this.recommendation,
      rawResponse: this.rawResponse,
    };
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  private async poll() {
    try {
      const res = await fetch(`${BACKEND_URL}?_=${Date.now()}`, { cache: 'no-store' });
      if (res.status === 204) {
        if (this.live || this.recommendation || this.rawResponse) {
          this.live = false;
          this.receivedAt = null;
          this.recommendation = null;
          this.rawResponse = null;
          this.lastReceivedAt = null;
          this.emit();
        }
        return;
      }
      if (!res.ok) return;

      const body = (await res.json()) as AgentApiBody;
      const receivedAt = body.receivedAt;
      const recommendation = body.recommendation;

      if (!receivedAt || !recommendation || typeof recommendation !== 'object') return;

      const isNew = receivedAt !== this.lastReceivedAt;
      this.lastReceivedAt = receivedAt;
      this.receivedAt = receivedAt;
      this.live = true;

      const payload = body.payload ?? recommendation.data;
      const insight =
        parseAgentInsight(payload) ??
        parseAgentInsight(recommendation.data) ??
        parseAgentInsight(recommendation);

      this.recommendation = {
        machineId: extractMachineId(payload, recommendation.machineId || 'COMP-01'),
        nodes: Array.isArray(recommendation.nodes) ? recommendation.nodes : [],
        edges: Array.isArray(recommendation.edges) ? recommendation.edges : [],
        hasGraph: recommendation.hasGraph,
        meta: recommendation.meta,
        data: recommendation.data ?? payload,
        insight,
      };

      this.rawResponse = {
        receivedAt,
        payload: payload ?? this.recommendation.data,
        recommendation: this.recommendation,
      };

      if (isNew) {
        console.log('[agent] full API JSON', this.rawResponse);
      }

      this.emit();
    } catch {
      // Agent relay offline — keep last known recommendation
    }
  }
}

export const agentLiveService = new AgentLiveService();
