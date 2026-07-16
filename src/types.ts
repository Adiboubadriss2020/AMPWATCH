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
export interface AgentNode {
  id: string;
  type: 'trigger' | 'action' | 'display' | 'agent' | 'agent-llm' | 'utility' | string;
  data: {
    name: string;
    label: string;
    description: string;
    parameters?: Record<string, unknown>;
  };
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface AgentRecommendation {
  id: string;
  receivedAt: string;
  machineId: string;
  nodes: AgentNode[];
  edges: AgentEdge[];
  isRead: boolean;
}
