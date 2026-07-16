import { useState, useEffect } from 'react';
import { mockTelemetryService } from './mockService';
// import { mqttSensorService } from './mqttService'; // Uncomment when switching to live MQTT
import type { Machine, Reading, KPIs, AgentRecommendation } from './types';
import { HeroChart } from './components/HeroChart';
import { KPIPanel } from './components/KPIPanel';
import { SimulationControl } from './components/SimulationControl';
import { AgentPanel } from './components/AgentPanel';
import { Logo } from './components/Logo';
import { RadarScanner } from './components/RadarScanner';
import { ConsumptionByArea } from './components/ConsumptionByArea';
import { EnergyForecasting } from './components/EnergyForecasting';
import { ConsumptionBreakdown } from './components/ConsumptionBreakdown';
import { AnomalyAlert } from './components/AnomalyAlert';

function App() {
  // State management
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('COMP-01');
  const [kpis, setKpis] = useState<KPIs>({
    coutEvite: 0,
    tempsDetection: 0,
    anomaliesSemaine: 0,
    tauxFaussesAlertes: 0,
    disponibiliteFlotte: 100,
    co2Evite: 0,
    scoreUsureMoyen: 0,
  });

  // Agent recommendation panel state
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);

  // Selected machine's chart series history
  const [activeHistory, setActiveHistory] = useState<{
    series: Reading[];
    baseline_min: number;
    baseline_max: number;
    anomaly_index: number;
  } | null>(null);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load initial data
  useEffect(() => {
    const initialMachines = mockTelemetryService.getMachines();
    setMachines(initialMachines);

    const initialKPIs = mockTelemetryService.getKPIs();
    setKpis(initialKPIs);
  }, []);

  // Fetch active history when selected machine changes, or when machines list is updated (to get latest reading)
  useEffect(() => {
    if (!selectedMachineId) return;
    const history = mockTelemetryService.getHistory(selectedMachineId);
    setActiveHistory(history);
  }, [selectedMachineId, machines]);

  // Subscribe to live WebSocket-like telemetry events (Simulator)
  useEffect(() => {
    const unsubscribe = mockTelemetryService.subscribeTelemetry((message) => {
      if (message.type === 'reading') {
        const updatedMachines = message.payload as Machine[];
        setMachines(updatedMachines);
        setKpis(mockTelemetryService.getKPIs());
      } else if (message.type === 'event') {
        setKpis(mockTelemetryService.getKPIs());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Expose addRecommendation for development testing
  const addRecommendation = (payload: { nodes: AgentRecommendation['nodes']; edges: AgentRecommendation['edges'] }, machineId = 'COMP-01') => {
    const rec: AgentRecommendation = {
      id: `rec_${Date.now()}`,
      receivedAt: new Date().toISOString(),
      machineId,
      nodes: payload.nodes,
      edges: payload.edges,
      isRead: false,
    };
    setRecommendations((prev) => [rec, ...prev]);
  };

  (window as any).__addRec = (payload: Parameters<typeof addRecommendation>[0]) =>
    addRecommendation(payload);

  const selectedMachine = machines.find((m) => m.machineId === selectedMachineId);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        width: '100vw',
        maxWidth: '100%',
        margin: '0',
        padding: '0 0 100px 0',
        backgroundColor: 'var(--color-bg)',
        overflowX: 'hidden',
      }}
    >
      {/* Header bar */}
      <header className="app-header">
        <div className="header-brand" style={{ gap: '0.6rem' }}>
          <Logo height={30} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <h1 style={{
              margin: 0, fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
              lineHeight: 1,
            }}>
              AMP<span style={{ color: 'var(--color-cyan)' }}>WATCH</span>
            </h1>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              {['Industry 4.0', 'Predictive Maintenance', 'Energy AI'].map(tag => (
                <span key={tag} style={{
                  fontSize: '0.5rem', fontWeight: 600,
                  color: 'var(--color-text-dim)',
                  border: '1px solid var(--color-hairline)',
                  padding: '1px 5px', borderRadius: '3px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  lineHeight: 1.6,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Machine selection dropdown in header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-sub)', fontWeight: 600, letterSpacing: '0.04em' }}>
            NODE SELECTION:
          </span>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-md)',
              padding: '0.35rem 1.8rem 0.35rem 0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--glow-cyan)',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%2329D3F0\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
              backgroundSize: '18px',
            }}
          >
            {machines.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId} ({m.status})
              </option>
            ))}
          </select>
        </div>

        {/* Live status badge + Theme + Notification */}
        <div className="header-actions">
          <div className="live-badge">
            <span 
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--color-green)',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 6px var(--color-green)',
              }}
            />
            <span 
              className="mono"
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-muted)',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
            >
              CAPTORS WS_LIVE: SECURE_CONN
            </span>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-sub)',
              transition: 'all 0.2s',
            }}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          <button
            id="notification-bell"
            onClick={() => setAgentPanelOpen(true)}
            title="AI Agent Recommendations"
            style={{
              position: 'relative',
              background: agentPanelOpen ? 'var(--color-blue-dim)' : 'var(--color-surface-alpha)',
              border: `1px solid ${recommendations.some(r => !r.isRead) ? 'var(--color-red)' : 'var(--color-border)'}`,
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={recommendations.some(r => !r.isRead) ? 'var(--color-red)' : 'var(--color-text)'} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {recommendations.filter(r => !r.isRead).length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: 'var(--color-red)',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 6px rgba(255,77,94,0.6)',
                  animation: 'pulse-badge 1.5s ease-in-out infinite',
                }}
              >
                {recommendations.filter(r => !r.isRead).length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 1.5rem' }}>
        {/* KPI Panel Row */}
        <KPIPanel kpis={kpis} />

        {/* 3-Column main dashboard view */}
        <main
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr 1fr',
            gap: '1rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Column 1: Real-Time Chart & Bar Breakdown */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeHistory && selectedMachine && (
              <HeroChart
                machine={selectedMachine}
                series={activeHistory.series}
                anomalyIndex={activeHistory.anomaly_index}
              />
            )}
            <ConsumptionByArea machines={machines} />
          </section>

          {/* Column 2: Sonar Radar Scanner & Anomaly Alert Card */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedMachine && (
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem' }}>
                <span className="section-label">⚡ Radar Scan Anomaly Detection</span>
                <RadarScanner hasAnomaly={selectedMachine.status !== 'NOMINAL'} anomalyType={selectedMachine.anomalyType || 'NONE'} />
              </div>
            )}
            {selectedMachine && (
              <AnomalyAlert machine={selectedMachine} />
            )}
          </section>

          {/* Column 3: Forecasting & Category Donut */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeHistory && selectedMachine && (
              <EnergyForecasting series={activeHistory.series} normalKw={selectedMachine.normalKw} />
            )}
            <ConsumptionBreakdown />
          </section>
        </main>
      </div>

      {/* Simulator fault-injection control console overlay */}
      <SimulationControl 
        machines={machines.map(m => ({ machineId: m.machineId, status: m.status }))} 
        selectedMachineId={selectedMachineId} 
      />

      {/* Agent Recommendation Panel (slide-in drawer) */}
      <AgentPanel
        recommendations={recommendations}
        isOpen={agentPanelOpen}
        onClose={() => setAgentPanelOpen(false)}
        onMarkRead={addRecommendation as any} // Keep standard signature
      />
    </div>
  );
}

export default App;
