export type MachineStatus = 'NOMINAL' | 'AVERTISSEMENT' | 'CRITIQUE';

export interface Machine {
  machineId: string;
  machineName: string;
  timestamp: string;
  date?: string;
  time?: string;
  kw: number;
  current: number;
  voltage: number;
  temp: number;
  humidite: number;
  pression: number;
  powerFactor: number;
  costPerHour: number;
  normalKw: number;
  deviation?: number;
  isAnomaly?: boolean;
  severity?: string;
  scenario: string;
  status: MachineStatus;
  anomaly: boolean;
  anomalyType?: string;
  cause?: string;
  potRaw: number;
  wifi_rssi: number;
  relay: boolean;
  cooldown_remaining: number | null; // cooldown in seconds, null if none
}

export interface Reading {
  t: string; // ISO string or time string e.g. "14:14:00"
  kw: number;
  status?: MachineStatus;
}

export interface EventLogItem {
  id: string;
  time: string;
  tag: 'NOMINAL' | 'AVERTISSEMENT' | 'CRITIQUE' | 'resolved';
  machineId: string;
  message: string;
  was_real_anomaly?: boolean | null; // null = pending review, true = confirmed, false = dismissed
}

export interface KPIs {
  waste_avoided: number; // in MAD
  time_to_detection: number; // average time in seconds
  anomalies_this_week: number; // total count
  false_alert_rate: number; // percentage (0 - 100)
  fleet_uptime: number; // percentage (0 - 100)
}

// --- Agent / Webhook Recommendation Payload ---

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
  id: string;                  // unique per recommendation
  receivedAt: string;          // ISO timestamp when panel received it
  machineId: string;           // which machine triggered this
  nodes: AgentNode[];
  edges: AgentEdge[];
  isRead: boolean;
}
