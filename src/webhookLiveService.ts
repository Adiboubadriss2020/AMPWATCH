import type { Machine, Reading, KPIs, MachineStatus } from './types';
import { formatDurationHours } from './moroccoSchedule';

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/payload`;
/** Fast poll so chart updates almost as soon as Fusion posts. */
const POLL_MS = 1000;
const HISTORY_LEN = 60;
/** No new API sample for this long → feed stopped (machine OFF, Off-Hours YES). */
const STALE_MS = 12_000;
/** Ignore gaps larger than this (pause / offline) so KPIs stay realistic. */
const MAX_INTERVAL_MS = 120_000;

function severityToStatus(severity?: string, isAnomaly?: boolean): MachineStatus {
  if (severity === 'CRITIQUE') return 'CRITIQUE';
  if (severity === 'ATTENTION' || severity === 'AVERTISSEMENT') return 'AVERTISSEMENT';
  if (isAnomaly) return 'AVERTISSEMENT';
  return 'NOMINAL';
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ''): string {
  return v == null || v === '' ? fallback : String(v);
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Map a raw webhook payload into the dashboard Machine model — API values only. */
export function mapPayloadToMachine(raw: Record<string, unknown>): Machine {
  const severity = str(raw.severity, 'NORMAL');
  const isAnomaly = raw.isAnomaly === true || severity === 'CRITIQUE' || severity === 'ATTENTION';
  const status = severityToStatus(severity, isAnomaly);
  const kw = num(raw.kw);
  const normalKw = num(raw.normalKw);
  const deviation =
    raw.deviation != null
      ? num(raw.deviation)
      : normalKw > 0
        ? Math.round(((kw - normalKw) / normalKw) * 100)
        : 0;

  return {
    machineId: str(raw.machineId, 'COMP-01'),
    machineName: str(raw.machineName, 'Compresseur Air 1'),
    timestamp: str(raw.timestamp, new Date().toISOString()),
    date: str(raw.date) || undefined,
    time: str(raw.time) || undefined,
    heure: raw.heure != null ? num(raw.heure) : undefined,

    kw,
    current: num(raw.current),
    voltage: num(raw.voltage),
    powerFactor: num(raw.powerFactor),
    normalKw,
    deviation,

    temp: num(raw.temp),
    humidite: num(raw.humidite),
    pression: num(raw.pression),

    costPerHour: num(raw.costPerHour),
    tarifKwh: raw.tarifKwh != null ? num(raw.tarifKwh) : undefined,
    trancheHoraire: str(raw.trancheHoraire) || undefined,
    conseilTarif: str(raw.conseilTarif) || undefined,

    co2ParHeure: raw.co2ParHeure != null ? num(raw.co2ParHeure) : undefined,
    co2ParJour: raw.co2ParJour != null ? num(raw.co2ParJour) : undefined,
    co2Economise: raw.co2Economise != null ? num(raw.co2Economise) : undefined,

    scoreUsure: raw.scoreUsure != null ? num(raw.scoreUsure) : undefined,
    prochaineMaintenance: str(raw.prochaineMaintenance) || undefined,
    dureeVieEstimee: raw.dureeVieEstimee != null ? num(raw.dureeVieEstimee) : undefined,

    driftPct: raw.driftPct != null ? num(raw.driftPct) : deviation,
    driftAlerte: raw.driftAlerte === true,
    driftMessage: str(raw.driftMessage) || undefined,

    horsProduction: false, // true only when API feed goes stale

    isAnomaly,
    anomalyType: str(raw.anomalyType) || undefined,
    severity,
    scenario: str(raw.scenario, 'NORMAL'),

    status,
    anomaly: isAnomaly || status !== 'NOMINAL',
    cause: str(raw.cause) || str(raw.driftMessage) || undefined,

    potRaw: raw.potRaw != null ? num(raw.potRaw) : undefined,
    wifi_rssi: num(raw.wifi_rssi),
    relay: raw.relay === true,
    cooldown_remaining: raw.cooldown_remaining != null ? num(raw.cooldown_remaining) : null,
  };
}

const EMPTY_KPIS: KPIs = {
  coutEvite: 0,
  tempsDetection: 0,
  anomaliesSemaine: 0,
  tauxFaussesAlertes: 0,
  disponibiliteFlotte: 0,
  co2Evite: 0,
  scoreUsureMoyen: 0,
};

type Listener = (state: {
  machines: Machine[];
  history: Reading[];
  anomalyIndex: number;
  kpis: KPIs;
  receivedAt: string | null;
  live: boolean;
  rawResponse: { receivedAt: string; payload: Record<string, unknown> } | null;
  /** True while new API samples keep arriving (within STALE_MS). */
  feedFresh: boolean;
  /** Accumulated time with API stopped (Off-Hours YES). */
  offHoursOnMs: number;
  offHoursOnLabel: string;
}) => void;

/**
 * Derive MAD/kWh from API only:
 * prefer tarifKwh; else costPerHour / kw when both present.
 */
function tarifFromApi(machine: Machine): number {
  if (machine.tarifKwh != null && machine.tarifKwh > 0) return machine.tarifKwh;
  if (machine.kw > 0 && machine.costPerHour > 0) return machine.costPerHour / machine.kw;
  return 0;
}

class WebhookLiveService {
  private machines: Machine[] = [];
  private history: Reading[] = [];
  private anomalyIndex = -1;
  private receivedAt: string | null = null;
  private live = false;
  private rawResponse: { receivedAt: string; payload: Record<string, unknown> } | null = null;
  private listeners = new Set<Listener>();
  private pollId: ReturnType<typeof setInterval> | null = null;
  private lastReceivedAt: string | null = null;

  // ── KPI accumulators (API-driven, reset on Stop Production / day change) ──
  private kpiDayKey: string | null = null;
  private lastSampleMs: number | null = null;
  private prevStatus: MachineStatus | null = null;
  private prevWasAnomaly = false;
  /** ms spent NOMINAL today (between samples) */
  private nominalMs = 0;
  /** ms of observed operation today (sum of sample intervals) = temps total journée mesuré */
  private totalDayMs = 0;
  private costAvoidedMad = 0;
  private co2AvoidedKg = 0;
  private anomalyCount = 0;
  private detectionLatenciesSec: number[] = [];
  private wearSum = 0;
  private wearSamples = 0;
  /** Wall-clock of last NEW sample (receivedAt changed). */
  private lastFreshWallMs: number | null = null;
  private feedFresh = false;
  /** ms spent with API stopped after we had been receiving */
  private offHoursOnMs = 0;
  private lastStaleTickMs: number | null = null;
  private staleWatchId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.pollId) return;
    void this.poll();
    this.pollId = setInterval(() => void this.poll(), POLL_MS);
    if (!this.staleWatchId) {
      this.staleWatchId = setInterval(() => this.tickFeedFreshness(), 1000);
    }
  }

  stop() {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
    if (this.staleWatchId) {
      clearInterval(this.staleWatchId);
      this.staleWatchId = null;
    }
  }

  reset() {
    const dirty =
      this.live ||
      this.machines.length > 0 ||
      this.history.length > 0 ||
      this.rawResponse != null ||
      this.receivedAt != null ||
      this.totalDayMs > 0;
    this.machines = [];
    this.history = [];
    this.anomalyIndex = -1;
    this.receivedAt = null;
    this.live = false;
    this.rawResponse = null;
    this.lastReceivedAt = null;
    this.resetKpiAccumulators();
    this.resetFeedState();
    if (dirty) this.emit();
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    cb(this.snapshot());
    return () => {
      this.listeners.delete(cb);
      if (this.listeners.size === 0) this.stop();
    };
  }

  getSnapshot() {
    return this.snapshot();
  }

  private resetKpiAccumulators() {
    this.kpiDayKey = null;
    this.lastSampleMs = null;
    this.prevStatus = null;
    this.prevWasAnomaly = false;
    this.nominalMs = 0;
    this.totalDayMs = 0;
    this.costAvoidedMad = 0;
    this.co2AvoidedKg = 0;
    this.anomalyCount = 0;
    this.detectionLatenciesSec = [];
    this.wearSum = 0;
    this.wearSamples = 0;
    // Keep feedFresh / lastFreshWallMs — day rollover must not fake an API stop
    this.offHoursOnMs = 0;
    this.lastStaleTickMs = null;
  }

  private resetFeedState() {
    this.lastFreshWallMs = null;
    this.feedFresh = false;
    this.offHoursOnMs = 0;
    this.lastStaleTickMs = null;
  }

  private snapshot() {
    return {
      machines: this.machines,
      history: this.history,
      anomalyIndex: this.anomalyIndex,
      kpis: this.computeKpis(),
      receivedAt: this.receivedAt,
      live: this.live,
      rawResponse: this.rawResponse,
      feedFresh: this.feedFresh,
      offHoursOnMs: this.offHoursOnMs,
      offHoursOnLabel: formatDurationHours(this.offHoursOnMs),
    };
  }

  /**
   * Receiving data → feedFresh=true, Off-Hours NO, machine may run.
   * API silent > STALE_MS → feedFresh=false, Off-Hours YES, machine stop.
   */
  private tickFeedFreshness() {
    const now = Date.now();
    const hadData = this.lastFreshWallMs != null;
    const fresh = hadData && now - this.lastFreshWallMs! <= STALE_MS;

    if (fresh) {
      this.lastStaleTickMs = null;
      if (!this.feedFresh) {
        this.feedFresh = true;
        this.applyHorsProduction(false);
        this.emit();
      }
      return;
    }

    // Stale / no feed
    if (hadData) {
      if (this.lastStaleTickMs == null) this.lastStaleTickMs = now;
      else {
        const dt = Math.min(MAX_INTERVAL_MS, Math.max(0, now - this.lastStaleTickMs));
        this.offHoursOnMs += dt;
        this.lastStaleTickMs = now;
      }
    }

    const wasFresh = this.feedFresh;
    this.feedFresh = false;
    this.applyHorsProduction(true);
    if (wasFresh || hadData) this.emit();
  }

  private applyHorsProduction(stopped: boolean) {
    if (this.machines[0]) {
      this.machines[0] = { ...this.machines[0], horsProduction: stopped };
    }
  }

  private markFreshSample() {
    this.lastFreshWallMs = Date.now();
    this.feedFresh = true;
    this.lastStaleTickMs = null;
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  /**
   * Uptime = (temps NOMINAL / temps total journée observé) × 100
   * Cost avoided = Σ max(0, normalKw − kw) × tarifKwh × Δh  (API fields only)
   * Detection = moyenne des latences (Δt entre dernier NOMINAL et 1er échantillon anomalie)
   */
  private computeKpis(): KPIs {
    const uptime =
      this.totalDayMs > 0 ? Math.min(100, Math.max(0, (this.nominalMs / this.totalDayMs) * 100)) : 0;
    const avgDetection =
      this.detectionLatenciesSec.length > 0
        ? this.detectionLatenciesSec.reduce((a, b) => a + b, 0) / this.detectionLatenciesSec.length
        : 0;
    const wear =
      this.wearSamples > 0 ? this.wearSum / this.wearSamples : this.machines[0]?.scoreUsure ?? 0;

    return {
      coutEvite: round(this.costAvoidedMad, 2),
      tempsDetection: round(avgDetection, 1),
      anomaliesSemaine: this.anomalyCount,
      tauxFaussesAlertes: 0,
      disponibiliteFlotte: round(uptime, 1),
      co2Evite: round(this.co2AvoidedKg, 3),
      scoreUsureMoyen: round(wear, 1),
    };
  }

  private dayKeyFromMachine(machine: Machine, receivedAt: string): string {
    if (machine.date && /^\d{4}-\d{2}-\d{2}/.test(machine.date)) return machine.date.slice(0, 10);
    if (machine.date && machine.date.includes('/')) {
      // e.g. 16/07/2026
      const m = machine.date.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    try {
      return new Date(receivedAt).toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  private accumulateKpis(machine: Machine, sampleMs: number) {
    const dayKey = this.dayKeyFromMachine(machine, new Date(sampleMs).toISOString());
    if (this.kpiDayKey !== dayKey) {
      this.resetKpiAccumulators();
      this.kpiDayKey = dayKey;
    }

    if (this.lastSampleMs != null) {
      const dtMs = Math.min(MAX_INTERVAL_MS, Math.max(0, sampleMs - this.lastSampleMs));
      if (dtMs > 0) {
        const dtH = dtMs / 3_600_000;

        // Temps total journée (observé) + temps nominal
        this.totalDayMs += dtMs;
        if (this.prevStatus === 'NOMINAL') {
          this.nominalMs += dtMs;
        }

        // Cost avoided vs baseline — only when drawing less than normalKw
        const tarif = tarifFromApi(machine);
        if (tarif > 0 && machine.normalKw > 0 && machine.kw < machine.normalKw) {
          const savedKw = machine.normalKw - machine.kw;
          this.costAvoidedMad += savedKw * tarif * dtH;
        }

        // CO₂ avoided — prefer API co2Economise rate; else scale co2ParHeure by under-baseline ratio
        if (machine.co2Economise != null && machine.co2Economise > 0) {
          this.co2AvoidedKg += machine.co2Economise * dtH;
        } else if (
          machine.co2ParHeure != null &&
          machine.co2ParHeure > 0 &&
          machine.kw > 0 &&
          machine.normalKw > machine.kw
        ) {
          const kgPerKwh = machine.co2ParHeure / machine.kw;
          this.co2AvoidedKg += (machine.normalKw - machine.kw) * kgPerKwh * dtH;
        }

        // Detection latency: first abnormal sample after NOMINAL → Δt since last sample
        const nowAnomaly = machine.isAnomaly === true || machine.status !== 'NOMINAL';
        if (!this.prevWasAnomaly && nowAnomaly) {
          this.anomalyCount += 1;
          this.detectionLatenciesSec.push(dtMs / 1000);
        }
      }
    }

    if (machine.scoreUsure != null) {
      this.wearSum += machine.scoreUsure;
      this.wearSamples += 1;
    }

    // Live sample ⇒ Off-Hours NO (API receiving)
    machine.horsProduction = false;

    this.lastSampleMs = sampleMs;
    this.prevStatus = machine.status;
    this.prevWasAnomaly = machine.isAnomaly === true || machine.status !== 'NOMINAL';
  }

  private formatTime(iso: string): string {
    try {
      return new Date(iso).toTimeString().slice(0, 8);
    } catch {
      return iso.slice(11, 19) || iso;
    }
  }

  private async poll() {
    try {
      const res = await fetch(`${BACKEND_URL}?_=${Date.now()}`, { cache: 'no-store' });
      if (res.status === 204 || res.status === 404) {
        // No payload on relay — feed stopped
        if (this.lastFreshWallMs != null) {
          this.lastFreshWallMs = Date.now() - STALE_MS - 1;
        }
        this.tickFeedFreshness();
        this.live = this.machines.length > 0;
        this.rawResponse = null;
        this.emit();
        return;
      }
      if (!res.ok) return;

      const body = await res.json();
      const receivedAt: string = body.receivedAt;
      const payload = body.payload;

      if (!payload || typeof payload !== 'object') return;

      const isNewSample = receivedAt !== this.lastReceivedAt;
      this.lastReceivedAt = receivedAt;
      this.receivedAt = receivedAt;
      this.live = true;
      this.rawResponse = {
        receivedAt,
        payload: payload as Record<string, unknown>,
      };

      const machine = mapPayloadToMachine(payload as Record<string, unknown>);

      if (isNewSample) {
        const sampleMs = Date.parse(receivedAt) || Date.now();
        this.markFreshSample();
        this.accumulateKpis(machine, sampleMs);
        machine.horsProduction = false;

        this.machines = [machine];

        const t = machine.time || this.formatTime(machine.timestamp);
        this.history = [
          ...this.history,
          { t, kw: machine.kw, status: machine.status },
        ].slice(-HISTORY_LEN);

        if (this.anomalyIndex === -1 && machine.status !== 'NOMINAL') {
          this.anomalyIndex = this.history.length - 1;
        }
        if (machine.status === 'NOMINAL') {
          this.anomalyIndex = -1;
        }
      } else {
        // Same payload timestamp — keep last machine, refresh Off-Hours from freshness
        machine.horsProduction = !this.feedFresh;
        if (this.machines.length === 0) this.machines = [machine];
        else {
          this.machines = [{ ...this.machines[0], ...machine, horsProduction: !this.feedFresh }];
        }
        this.tickFeedFreshness();
      }

      this.emit();
    } catch {
      // Relay offline — treat as feed stopped
      this.tickFeedFreshness();
    }
  }
}

export const webhookLiveService = new WebhookLiveService();
