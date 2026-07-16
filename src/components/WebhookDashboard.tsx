import React, { useState, useEffect } from 'react';

interface WebhookPayloadRecord {
  receivedAt: string;
  payload: any;
}

export const WebhookDashboard: React.FC = () => {
  const [records, setRecords] = useState<WebhookPayloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set VITE_BACKEND_URL in Netlify env vars to point to the Render backend
  const backendUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/payload`;

  const loadRecords = async (isFirstLoad = false) => {
    try {
      if (isFirstLoad) {
        setLoading(true);
      }
      setError(null);
      // 204 = no payload stored yet, just skip silently
      const response = await fetch(backendUrl);
      if (response.status === 204) {
        return;
      }
      if (!response.ok) {
        throw new Error(`Relay backend error (${response.status})`);
      }

      // Response shape: { receivedAt: string, payload: object }
      const { receivedAt, payload: data } = await response.json();

      if (data && typeof data === 'object' && Object.keys(data).length > 0 && data.machineId) {
        setRecords((prev) => {
          // Deduplicate by receivedAt timestamp from the relay server
          const isDuplicate = prev.some(
            (r) => r.receivedAt === receivedAt
          );

          if (isDuplicate) {
            return prev;
          }

          // Prepend the new record, limit to last 50 entries
          const updated = [{ receivedAt, payload: data }, ...prev];
          return updated.slice(0, 50);
        });
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load webhook data');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRecords(true);
  }, []);

  const latestRecord = records[0];
  const payload = latestRecord?.payload;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '500px', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '1rem' }}>
        <div>
          <div className="section-label" style={{ color: 'var(--color-cyan)', fontSize: '0.72rem', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-cyan)', boxShadow: '0 0 6px var(--color-cyan)', display: 'inline-block' }} />
            LIVE WEBHOOK INSPECTOR
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0 0', fontFamily: 'var(--font-heading)' }}>Incoming Webhook Stream</h2>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-sub)', fontSize: '0.85rem', maxWidth: '45rem', lineHeight: 1.4 }}>
            <strong>Read-only.</strong> Payloads are received by the relay backend (<code style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>POST localhost:3001/webhook</code>) and stored.
            The frontend reads the last stored payload via <code style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>GET localhost:3001/payload</code> — no trigger is sent to the workflow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadRecords(true)}
          style={{
            backgroundColor: 'var(--color-cyan)',
            border: 'none',
            borderRadius: 'var(--r-md)',
            color: 'black',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.04em',
            padding: '0.55rem 1.1rem',
            cursor: 'pointer',
            boxShadow: 'var(--glow-cyan)',
            transition: 'all 0.2s',
          }}
        >
          Refresh Response
        </button>
      </div>

      {/* Info strip */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--color-overlay)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--r-lg)', flex: '1 1 180px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-sub)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Received Payloads</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>{records.length}</div>
        </div>
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--color-overlay)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--r-lg)', flex: '1 1 200px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-sub)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connection Status</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-green)', display: 'inline-block', animation: 'pulse-badge 1.5s infinite' }} />
            LISTENING
          </div>
        </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-sub)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relay Backend (Frontend reads from here)</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
            {backendUrl}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.9rem 1.2rem', backgroundColor: 'var(--color-red-dim)', border: '1px solid var(--color-red)', borderRadius: 'var(--r-lg)', color: 'var(--color-red)', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main workspace area */}
      {loading && records.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', color: 'var(--color-text-sub)', fontSize: '0.9rem' }}>
          Connecting to Webhook API and waiting for telemetry stream...
        </div>
      ) : records.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', color: 'var(--color-text-sub)', fontSize: '0.9rem' }}>
          No telemetry payloads received yet. Trigger factory activity or check the endpoint.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Beautiful Live Telemetry Card representation of the latest payload */}
          {payload && (
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                border: `1px solid ${payload.isAnomaly ? 'var(--color-red)' : 'var(--color-border)'}`,
                boxShadow: payload.isAnomaly ? 'var(--glow-red)' : 'none',
                borderRadius: 'var(--r-xl)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                animation: 'pulse-border 2s infinite alternate',
              }}
            >
              {/* Header inside the card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-sub)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    LATEST WEBHOOK TELEMETRY PACKET
                  </span>
                  <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.15rem', color: 'var(--color-text)' }}>
                    {payload.machineName || payload.machineId} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-cyan)' }}>({payload.machineId})</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* Anomaly Badge */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '20px',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: payload.isAnomaly ? 'var(--color-red-dim)' : 'var(--color-green-dim)',
                      color: payload.isAnomaly ? 'var(--color-red)' : 'var(--color-green)',
                      border: `1px solid ${payload.isAnomaly ? 'var(--color-red)' : 'var(--color-green)'}`,
                    }}
                  >
                    {payload.isAnomaly ? `ANOMALY: ${payload.anomalyType || 'GENERIC'}` : 'NOMINAL STATUS'}
                  </span>

                  {/* Severity Badge */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.3rem 0.7rem',
                      borderRadius: '20px',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: payload.severity === 'CRITIQUE' ? 'var(--color-red-dim)' : payload.severity === 'ATTENTION' ? 'var(--color-amber-dim)' : 'var(--color-cyan-dim)',
                      color: payload.severity === 'CRITIQUE' ? 'var(--color-red)' : payload.severity === 'ATTENTION' ? 'var(--color-amber)' : 'var(--color-cyan)',
                      border: `1px solid ${payload.severity === 'CRITIQUE' ? 'var(--color-red)' : payload.severity === 'ATTENTION' ? 'var(--color-amber)' : 'var(--color-cyan)'}`,
                    }}
                  >
                    {payload.severity || 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Grid of Key Telemetry Numbers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div style={{ padding: '0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Power Draw</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: payload.isAnomaly ? 'var(--color-red)' : 'var(--color-cyan)' }}>
                    {payload.kw} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kW</span>
                  </div>
                </div>

                <div style={{ padding: '0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Current</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {payload.current} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>A</span>
                  </div>
                </div>

                <div style={{ padding: '0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Voltage</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {payload.voltage} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>V</span>
                  </div>
                </div>

                <div style={{ padding: '0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Temperature</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: payload.temp > 50 ? 'var(--color-amber)' : 'var(--color-text)' }}>
                    {payload.temp} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>°C</span>
                  </div>
                </div>

                <div style={{ padding: '0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Pressure</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {payload.pression} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>hPa</span>
                  </div>
                </div>

                <div style={{ padding: '0.65rem', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-hairline)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Wear Level</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: payload.scoreUsure > 60 ? 'var(--color-red)' : payload.scoreUsure > 30 ? 'var(--color-amber)' : 'var(--color-green)' }}>
                    {payload.scoreUsure}%
                  </div>
                </div>
              </div>

              {/* Maintenance Alert and Tariff Warnings if any */}
              {(payload.driftAlerte || payload.conseilTarif || payload.scoreUsure > 40) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.85rem', backgroundColor: 'var(--color-surface)', borderRadius: '10px', border: '1px dashed var(--color-hairline)' }}>
                  {payload.driftAlerte && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>⚠️</span> <strong>Drift Warning:</strong> {payload.driftMessage || 'Energy drift detected.'}
                    </div>
                  )}
                  {payload.conseilTarif && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>💡</span> <strong>Tariff Optimization:</strong> {payload.conseilTarif}
                    </div>
                  )}
                  {payload.scoreUsure > 40 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-sub)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>🔧</span> <strong>Maintenance Recommendation:</strong> Next maintenance prediction: <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>{payload.prochaineMaintenance}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Footer info: Tariffs, CO2, and timestamps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--color-text-sub)', borderTop: '1px solid var(--color-hairline)', paddingTop: '0.75rem' }}>
                <div>
                  ⚡ Tranche: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{payload.trancheHoraire}</span> ({payload.tarifKwh} DH/kWh)
                </div>
                <div>
                  🌿 CO₂ Footprint: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{payload.co2ParHeure} kg/h</span>
                </div>
                <div>
                  🕒 Packet timestamp: <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{latestRecord.receivedAt}</span>
                </div>
              </div>
            </div>
          )}

          {/* Historical Payloads details / summary list */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payload Log History ({records.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {records.map((record, index) => {
                const isAnomaly = record.payload?.isAnomaly;
                return (
                  <details
                    key={`${record.receivedAt}-${index}`}
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: `1px solid ${isAnomaly ? 'var(--color-red)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--r-md)',
                      padding: '0.75rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <summary
                      style={{
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        fontSize: '0.82rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        listStyle: 'none',
                        outline: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isAnomaly ? 'var(--color-red)' : 'var(--color-green)',
                          boxShadow: `0 0 4px ${isAnomaly ? 'var(--color-red)' : 'var(--color-green)'}`,
                          display: 'inline-block'
                        }} />
                        <span>{record.receivedAt}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>
                          {record.payload?.kw || 0} kW
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                          (Payload {records.length - index}) ▾
                        </span>
                      </div>
                    </summary>
                    <pre
                      style={{
                        marginTop: '0.65rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.72rem',
                        lineHeight: 1.4,
                        color: 'var(--color-text-sub)',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        overflowX: 'auto',
                        border: '1px solid var(--color-hairline)',
                      }}
                    >
                      {JSON.stringify(record.payload, null, 2)}
                    </pre>
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
