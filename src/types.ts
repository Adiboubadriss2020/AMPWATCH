export type MachineStatus = 'NOMINAL' | 'AVERTISSEMENT' | 'CRITIQUE';

// ─── Machine (corresponds exactly to the backend transformation output) ────────
export interface Machine {
  // Identité
  machineId: string;
  machineName: string;
  timestamp: string;
  date?: string;
  time?: string;
  heure?: number;

  // Électricité
  kw: number;
  current: number;
  voltage: number;
  powerFactor: number;
  normalKw: number;
  deviation: number;

  // Environnement
  temp: number;
  humidite: number;
  pression: number;

  // Coût (FEATURE 4 – Tarification HP/HC Maroc)
  costPerHour: number;
  tarifKwh?: number;
  trancheHoraire?: 'HEURES_PLEINES' | 'HEURES_CREUSES' | string;
  conseilTarif?: string;

  // CO₂ (FEATURE 2)
  co2ParHeure?: number;
  co2ParJour?: number;
  co2Economise?: number;

  // Maintenance prédictive (FEATURE 1)
  scoreUsure?: number;
  prochaineMaintenance?: string;
  dureeVieEstimee?: number;

  // Dérive lente (FEATURE 3)
  driftPct?: number;
  driftAlerte?: boolean;
  driftMessage?: string;

  // Hors production (FEATURE 7)
  horsProduction?: boolean;

  // Détection anomalie
  isAnomaly?: boolean;
  anomalyType?: string;
  severity?: string;
  scenario: string;

  // Status interne dashboard
  status: MachineStatus;
  anomaly: boolean;
  cause?: string;

  // Capteur IoT optionnel
  potRaw?: number;
  wifi_rssi: number;
  relay: boolean;
  cooldown_remaining: number | null;
  forcedStatus?: MachineStatus | null;
}

// ─── Série historique pour le graphique ───────────────────────────────────────
export interface Reading {
  t: string;
  kw: number;
  status?: MachineStatus;
}

// ─── Journal d'activité ───────────────────────────────────────────────────────
export interface EventLogItem {
  id: string;
  time: string;
  tag: 'NOMINAL' | 'AVERTISSEMENT' | 'CRITIQUE' | 'resolved';
  machineId: string;
  message: string;
  was_real_anomaly?: boolean | null;
}

// ─── KPIs tableau de bord ─────────────────────────────────────────────────────
export interface KPIs {
  coutEvite: number;             // MAD économisés
  tempsDetection: number;        // secondes moyen
  anomaliesSemaine: number;      // total confirmées
  tauxFaussesAlertes: number;    // % (0-100)
  disponibiliteFlotte: number;   // % (0-100)
  co2Evite: number;              // kg CO₂ économisés
  scoreUsureMoyen: number;       // 0-100
}

// ─── Recommandation Agent IA (webhook payload) ────────────────────────────────
export interface AgentNodeData {
  name: string;
  label: string;
  description: string;
  parameters?: Record<string, unknown>;
  inputs?: Record<string, { label: string }>;
  outputs?: Record<string, { label: string; isConnectable?: boolean }>;
  showRunningStatus?: boolean;
  _morphing?: boolean;
}

export interface AgentNode {
  id: string;
  type: 'trigger' | 'action' | 'display' | 'agent' | 'agent-llm' | 'utility' | string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  dragHandle?: string;
  data: AgentNodeData;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/** Live Fusion anomaly advice (POST /agent payload) */
export interface AgentInsight {
  diagnostic: string;
  cause_probable: string;
  risque_panne: string;
  score_risque: number | null;
  action_immediate: string;
  action_planifiee: string;
  conseil_economie: string;
  impact_co2: string;
  perte_estimee_jour: number | null;
  prediction_panne_jours: number | null;
  recommandation_hitl: string;
}

export interface AgentRecommendation {
  id: string;
  receivedAt: string;
  machineId: string;
  /** Optional workflow graph (legacy / Fusion graph mode) */
  nodes: AgentNode[];
  edges: AgentEdge[];
  /** Structured anomaly advice from the live agent API */
  insight: AgentInsight | null;
  isRead: boolean;
}
