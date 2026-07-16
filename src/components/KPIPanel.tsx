import React from 'react';
import type { KPIs } from '../types';

interface KPIPanelProps {
  kpis: KPIs;
}

interface KPIRowProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  rightBadge?: string;
  badgeColor?: string;
}

const KPIRow: React.FC<KPIRowProps> = ({ label, value, sub, accent = 'var(--color-text)', rightBadge, badgeColor }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.6rem 0',
      borderBottom: '1px solid var(--color-border)',
    }}
  >
    <div>
      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: '0.625rem', color: 'var(--color-text-dim)', marginTop: '1px' }}>{sub}</div>}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
      <span className="mono" style={{ fontSize: '1rem', fontWeight: 600, color: accent, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
        {value}
      </span>
      {rightBadge && (
        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: badgeColor ?? 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {rightBadge}
        </span>
      )}
    </div>
  </div>
);

export const KPIPanel: React.FC<KPIPanelProps> = ({ kpis }) => {
  const {
    coutEvite,
    tempsDetection,
    anomaliesSemaine,
    tauxFaussesAlertes,
    disponibiliteFlotte,
    co2Evite,
    scoreUsureMoyen,
  } = kpis;

  const scoreColor = scoreUsureMoyen > 80 ? 'var(--color-critical)'
    : scoreUsureMoyen > 60 ? 'var(--color-warning)'
    : scoreUsureMoyen > 40 ? 'var(--color-amber)'
    : 'var(--color-text)';

  const dispoColor = disponibiliteFlotte >= 95 ? 'var(--color-nominal)'
    : disponibiliteFlotte >= 80 ? 'var(--color-warning)'
    : 'var(--color-critical)';

  return (
    <div
      className="panel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.01em' }}>
          Impact Metrics
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          LIVE
        </span>
      </div>

      {/* KPI Rows */}
      <div style={{ padding: '0 0.875rem', flexGrow: 1, overflowY: 'auto' }}>
        <KPIRow
          label="Avoided Cost"
          value={`${coutEvite.toFixed(2)} MAD`}
          sub="Drift × duration × tariff (HP/HC)"
          accent="var(--color-nominal)"
        />
        <KPIRow
          label="CO₂ Prevented"
          value={`${co2Evite.toFixed(3)} kg`}
          sub={`Morocco Grid mix · 0.7 kg/kWh`}
          accent="var(--color-blue)"
        />
        <KPIRow
          label="Fleet Availability"
          value={`${disponibiliteFlotte.toFixed(1)}%`}
          sub="Time spent operating normally"
          accent={dispoColor}
          rightBadge={disponibiliteFlotte >= 95 ? '✓ Good' : disponibiliteFlotte >= 80 ? '⚠ Warning' : '✗ Critical'}
          badgeColor={dispoColor}
        />
        <KPIRow
          label="Avg Wear Score"
          value={`${scoreUsureMoyen} / 100`}
          sub={scoreUsureMoyen > 60 ? 'Maintenance scheduled' : 'Normal wear'}
          accent={scoreColor}
        />
        <KPIRow
          label="Detection Delay"
          value={`${tempsDetection.toFixed(1)} s`}
          sub="Anomaly → manager notification"
          accent="var(--color-text)"
        />
        <KPIRow
          label="False Alerts Rate"
          value={`${tauxFaussesAlertes}%`}
          sub="Dismissed vs. confirmed warnings"
          accent={tauxFaussesAlertes > 25 ? 'var(--color-warning)' : 'var(--color-text)'}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Active Anomalies
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-dim)', marginTop: '1px' }}>Excludes dismissed alerts</div>
          </div>
          <span className="mono" style={{ fontSize: '1rem', fontWeight: 600, color: anomaliesSemaine > 0 ? 'var(--color-critical)' : 'var(--color-text)' }}>
            {anomaliesSemaine}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '0.4rem 0.875rem', borderTop: '1px solid var(--color-border)', fontSize: '0.6rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Tariff Peak 0.15 · Off-Peak 0.08 DH/kWh
      </div>
    </div>
  );
};

export default KPIPanel;
