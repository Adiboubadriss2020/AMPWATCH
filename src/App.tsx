import { useState, useEffect, useRef } from 'react';
import { webhookLiveService } from './webhookLiveService';
import { agentLiveService } from './agentLiveService';
import type { Machine, Reading, KPIs, AgentRecommendation } from './types';
import { HeroChart } from './components/HeroChart';
import { KPIPanel } from './components/KPIPanel';
import { AgentPanel } from './components/AgentPanel';
import { Logo } from './components/Logo';
import { AssetHealthPanel } from './components/AssetHealthPanel';
import { Compressor3D } from './components/Compressor3D';
import { AnomalyAlert, type AnomalyEvent } from './components/AnomalyAlert';
import { EMPTY_KPIS, WAITING_MACHINE } from './waitingState';

function App() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('COMP-01');
  const [kpis, setKpis] = useState<KPIs>({ ...EMPTY_KPIS });
  const [anomalyEvents, setAnomalyEvents] = useState<AnomalyEvent[]>([]);
  const [liveFeed, setLiveFeed] = useState(false);
  const [offHoursOnLabel, setOffHoursOnLabel] = useState('0m');
  const [feedFresh, setFeedFresh] = useState(false);

  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);

  const [activeHistory, setActiveHistory] = useState<{
    series: Reading[];
    baseline_min: number;
    baseline_max: number;
    anomaly_index: number;
  } | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [productionOn, setProductionOn] = useState(false);
  const lastReceivedRef = useRef<string | null>(null);
  const lastAgentReceivedRef = useRef<string | null>(null);
  const productionOnRef = useRef(productionOn);
  productionOnRef.current = productionOn;

  // Production plugin: ON = accept APIs + twin running · OFF = stop polling
  useEffect(() => {
    if (productionOn) {
      webhookLiveService.start();
      agentLiveService.start();
    } else {
      webhookLiveService.stop();
      webhookLiveService.reset();
      agentLiveService.stop();
      agentLiveService.reset();
      setLiveFeed(false);
      setMachines([]);
      setActiveHistory(null);
      setAnomalyEvents([]);
      setKpis({ ...EMPTY_KPIS });
      setRecommendations([]);
      setOffHoursOnLabel('0m');
      setFeedFresh(false);
      lastReceivedRef.current = null;
      lastAgentReceivedRef.current = null;
    }
  }, [productionOn]);

  // ── LIVE WEBHOOK API — polls GET /payload via webhookLiveService ────────────
  useEffect(() => {
    const unsubLive = webhookLiveService.subscribe((snap) => {
      if (!productionOnRef.current) return;

      if (!snap.live || snap.machines.length === 0) {
        setLiveFeed(false);
        setMachines([]);
        setActiveHistory(null);
        setAnomalyEvents([]);
        setKpis({ ...EMPTY_KPIS });
        setOffHoursOnLabel('0m');
        setFeedFresh(false);
        lastReceivedRef.current = null;
        return;
      }

      setLiveFeed(true);
      setOffHoursOnLabel(snap.offHoursOnLabel);
      setFeedFresh(snap.feedFresh);
      setMachines(
        snap.machines.map((m, i) =>
          i === 0 ? { ...m, horsProduction: !snap.feedFresh } : m,
        ),
      );
      setSelectedMachineId((prev) =>
        snap.machines.some((m) => m.machineId === prev) ? prev : snap.machines[0].machineId,
      );

      const m = snap.machines[0];
      setActiveHistory({
        series: snap.history,
        baseline_min: Math.round(m.normalKw * 0.9),
        baseline_max: Math.round(m.normalKw * 1.1),
        anomaly_index: snap.anomalyIndex,
      });

      const isNewSample = snap.receivedAt != null && snap.receivedAt !== lastReceivedRef.current;
      if (isNewSample) lastReceivedRef.current = snap.receivedAt;

      setAnomalyEvents((prev) => {
        let next = prev;
        if (isNewSample && (m.isAnomaly || m.status !== 'NOMINAL')) {
          const evt: AnomalyEvent = {
            id: `anom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            time: m.time || new Date().toTimeString().slice(0, 8),
            machineId: m.machineId,
            machineName: m.machineName,
            anomalyType: m.anomalyType || 'ANOMALY',
            severity: m.severity || m.status,
            status: m.status,
            scenario: m.scenario,
            kw: m.kw,
            normalKw: m.normalKw,
            deviation: m.deviation,
            message: m.cause || m.driftMessage || '',
          };
          next = [evt, ...prev].slice(0, 80);
        }
        setKpis({
          ...snap.kpis,
          // Prefer live event list length when it has more detail; else service transition count
          anomaliesSemaine: Math.max(snap.kpis.anomaliesSemaine, next.length),
        });
        return next;
      });
    });

    return () => unsubLive();
  }, []);

  // ── LIVE AGENT API — polls GET /agent (multi-anomaly history) ───────────────
  useEffect(() => {
    const unsubAgent = agentLiveService.subscribe((snap) => {
      if (!productionOnRef.current) return;

      if (!snap.live || !snap.rawResponse) {
        setRecommendations([]);
        lastAgentReceivedRef.current = null;
        return;
      }

      if (!snap.recommendation || !snap.receivedAt) return;

      const isNew = snap.receivedAt !== lastAgentReceivedRef.current;
      if (!isNew) return;
      lastAgentReceivedRef.current = snap.receivedAt;

      const { recommendation } = snap;
      const hasInsight = Boolean(recommendation.insight);
      const hasGraph = Array.isArray(recommendation.nodes) && recommendation.nodes.length > 0;

      if (!hasInsight && !hasGraph) return;

      const rec: AgentRecommendation = {
        id: `rec_${snap.receivedAt}_${Date.now()}`,
        receivedAt: snap.receivedAt,
        machineId: recommendation.machineId || 'COMP-01',
        nodes: recommendation.nodes || [],
        edges: recommendation.edges || [],
        insight: recommendation.insight,
        isRead: false,
      };
      setRecommendations((prev) => [rec, ...prev].slice(0, 50));
    });

    return () => unsubAgent();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addRecommendation = (
    payload: { nodes: AgentRecommendation['nodes']; edges: AgentRecommendation['edges'] },
    machineId = 'COMP-01',
  ) => {
    const rec: AgentRecommendation = {
      id: `rec_${Date.now()}`,
      receivedAt: new Date().toISOString(),
      machineId,
      nodes: payload.nodes,
      edges: payload.edges,
      insight: null,
      isRead: false,
    };
    setRecommendations((prev) => [rec, ...prev]);
  };

  const markRecommendationRead = (id: string) => {
    setRecommendations((prev) => prev.map((rec) => (rec.id === id ? { ...rec, isRead: true } : rec)));
  };

  (window as unknown as { __addRec: typeof addRecommendation }).__addRec = (payload) =>
    addRecommendation(payload);

  const ingesting = productionOn && liveFeed;
  /** Live sensor stream is fresh. */
  const machineRunning = productionOn && feedFresh;
  /** API stopped after we had data → Off-Hours YES. */
  const offHoursYes = productionOn && liveFeed && !feedFresh;
  /**
   * Twin boots on Start Production, runs while listening or receiving,
   * stops only when the feed goes stale (Off-Hours).
   */
  const twinRunning = productionOn && !offHoursYes;
  const selectedMachine =
    ingesting && machines.length > 0
      ? machines.find((m) => m.machineId === selectedMachineId) || machines[0]
      : null;
  const displayMachine = selectedMachine ?? WAITING_MACHINE;
  const displayHistory = ingesting && activeHistory
    ? activeHistory
    : { series: [] as Reading[], baseline_min: 0, baseline_max: 0, anomaly_index: -1 };

  const toggleProduction = () => setProductionOn((on) => !on);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        width: '100vw',
        maxWidth: '100%',
        margin: '0',
        padding: '0 0 1rem 0',
        backgroundColor: 'var(--color-bg)',
        overflowX: 'hidden',
      }}
    >
      <header className="app-header">
        <div className="header-brand">
          <Logo height={88} theme={theme} />
        </div>

        <div className="header-production">
          <button
            type="button"
            className={`production-toggle${productionOn ? ' is-on' : ' is-off'}`}
            onClick={toggleProduction}
            title={productionOn ? 'Stop production — pause API ingestion' : 'Start production — enable APIs & twin'}
          >
            <span className="production-toggle-dot" aria-hidden />
            <span className="production-toggle-label">
              {productionOn ? 'Stop Production' : 'Start Production'}
            </span>
          </button>
        </div>

        <div className="header-end">
          <div className="header-node">
            <span className="header-node-label">NODE</span>
            <div
              className={`node-status-chip${
                !productionOn ? ' is-standby' : machineRunning ? ' is-live' : ingesting && !feedFresh ? ' is-stale' : ' is-listening'
              }`}
            >
              <span className="node-status-dot" aria-hidden />
              <span className="node-status-text mono">
                {!productionOn
                  ? 'Standby · production offline'
                  : machineRunning && selectedMachine
                    ? `${selectedMachine.machineId} · ${selectedMachine.machineName} · ${selectedMachine.kw.toFixed(1)} kW`
                    : ingesting && !feedFresh && selectedMachine
                      ? `${selectedMachine.machineId} · signal lost · holding last sample`
                      : 'Listening for sensors…'}
              </span>
            </div>
          </div>

          <div className="header-actions">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          <button
            id="notification-bell"
            onClick={() => setAgentPanelOpen(true)}
            title="AI Agent Recommendations"
            style={{
              position: 'relative',
              background: agentPanelOpen ? 'var(--color-blue-dim)' : 'var(--color-surface-alpha)',
              border: `1px solid ${recommendations.some((r) => !r.isRead) ? 'var(--color-red)' : 'var(--color-border)'}`,
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
              stroke={recommendations.some((r) => !r.isRead) ? 'var(--color-red)' : 'var(--color-text)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {recommendations.filter((r) => !r.isRead).length > 0 && (
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
                {recommendations.filter((r) => !r.isRead).length}
              </span>
            )}
          </button>
        </div>
        </div>
      </header>

      <div className="dashboard-body">
            <KPIPanel kpis={kpis} />

            <main className="dashboard-main">
              <section className="dash-panel dash-panel--chart">
                <HeroChart
                  machine={displayMachine}
                  series={displayHistory.series}
                  anomalyIndex={displayHistory.anomaly_index}
                />
              </section>

              <section className="dash-panel dash-panel--twin">
                <Compressor3D
                  key={`twin-${theme}`}
                  status={displayMachine.status}
                  kw={machineRunning ? displayMachine.kw : 0}
                  machineId={ingesting ? displayMachine.machineId : productionOn ? 'COMP-01' : '—'}
                  machineName={
                    ingesting
                      ? displayMachine.machineName
                      : productionOn
                        ? 'Listening for sensors…'
                        : 'Production stopped'
                  }
                  theme={theme}
                  running={twinRunning}
                  offHoursAlert={offHoursYes}
                  offHoursOnLabel={ingesting ? offHoursOnLabel : '0m'}
                />
              </section>

              <section className="dash-panel dash-panel--alerts">
                <AnomalyAlert
                  events={productionOn ? anomalyEvents : []}
                  onClear={() => {
                    setAnomalyEvents([]);
                    setKpis((prev) => ({ ...prev, anomaliesSemaine: 0 }));
                  }}
                />
              </section>
            </main>

            <AssetHealthPanel
              machine={{
                ...displayMachine,
                horsProduction: offHoursYes ? true : ingesting ? false : displayMachine.horsProduction,
              }}
              waiting={!ingesting}
              offHoursOnLabel={ingesting ? offHoursOnLabel : '0m'}
            />
      </div>

      <AgentPanel
        recommendations={recommendations}
        isOpen={agentPanelOpen}
        onClose={() => setAgentPanelOpen(false)}
        onMarkRead={markRecommendationRead}
      />
    </div>
  );
}

export default App;
