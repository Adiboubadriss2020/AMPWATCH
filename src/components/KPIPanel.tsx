import React from 'react';
import type { KPIs } from '../types';

interface KPIPanelProps { kpis: KPIs; }

interface GaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  dimColor: string;
  icon: string;
  sub?: string;
}

const Gauge: React.FC<GaugeProps> = ({ label, value, max, unit, color, dimColor, icon, sub }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.75rem 0.5rem',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--r-lg)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = color;
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${dimColor}`;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
    }}
    >
      {/* Ring */}
      <div style={{ position: 'relative', width: '72px', height: '72px' }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke="var(--color-hairline)"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1px',
        }}>
          <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{icon}</span>
          <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color, lineHeight: 1 }}>
            {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
            <span style={{ fontSize: '0.5rem', fontWeight: 500, color: 'var(--color-text-sub)' }}>{unit}</span>
          </span>
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.3 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: '0.55rem', color: 'var(--color-text-dim)', marginTop: '2px', lineHeight: 1.2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

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

  const gauges: GaugeProps[] = [
    {
      label: 'Fleet Uptime',
      value: disponibiliteFlotte,
      max: 100,
      unit: '%',
      color: disponibiliteFlotte >= 90 ? 'var(--color-green)' : disponibiliteFlotte >= 75 ? 'var(--color-amber)' : 'var(--color-red)',
      dimColor: disponibiliteFlotte >= 90 ? 'rgba(63,209,107,0.3)' : 'rgba(255,75,75,0.3)',
      icon: '⚡',
      sub: 'Normal operation',
    },
    {
      label: 'Anomalies',
      value: anomaliesSemaine,
      max: Math.max(10, anomaliesSemaine + 2),
      unit: '',
      color: anomaliesSemaine > 0 ? 'var(--color-red)' : 'var(--color-green)',
      dimColor: 'rgba(255,75,75,0.3)',
      icon: '🔴',
      sub: 'Active alerts',
    },
    {
      label: 'Wear Score',
      value: scoreUsureMoyen,
      max: 100,
      unit: '%',
      color: scoreUsureMoyen > 70 ? 'var(--color-red)' : scoreUsureMoyen > 40 ? 'var(--color-amber)' : 'var(--color-cyan)',
      dimColor: 'rgba(41,211,240,0.3)',
      icon: '🔧',
      sub: 'Avg wear index',
    },
    {
      label: 'False Alerts',
      value: tauxFaussesAlertes,
      max: 100,
      unit: '%',
      color: tauxFaussesAlertes > 25 ? 'var(--color-amber)' : 'var(--color-green)',
      dimColor: 'rgba(242,184,75,0.3)',
      icon: '⚠️',
      sub: 'Dismissed rate',
    },
    {
      label: 'CO₂ Saved',
      value: co2Evite,
      max: Math.max(1, co2Evite * 2),
      unit: 'kg',
      color: 'var(--color-cyan)',
      dimColor: 'rgba(41,211,240,0.3)',
      icon: '🌿',
      sub: '0.7 kg/kWh mix',
    },
    {
      label: 'Detection',
      value: tempsDetection,
      max: 10,
      unit: 's',
      color: tempsDetection < 3 ? 'var(--color-cyan)' : 'var(--color-amber)',
      dimColor: 'rgba(41,211,240,0.3)',
      icon: '🎯',
      sub: 'Avg response',
    },
  ];

  return (
    <div
      className="panel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{
        padding: '0.625rem 0.875rem',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ◈ Impact Metrics
        </span>
        <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          LIVE
        </span>
      </div>

      {/* Gauges grid */}
      <div style={{
        padding: '0.75rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        flexGrow: 1,
        overflowY: 'auto',
      }}>
        {gauges.map((g) => (
          <Gauge key={g.label} {...g} />
        ))}
      </div>

      {/* Footer: Avoided cost — hero number */}
      <div style={{
        padding: '0.5rem 0.875rem',
        borderTop: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(41,211,240,0.04)',
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Avoided Cost
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--color-text-dim)' }}>Drift × duration × tariff</div>
        </div>
        <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-green)', letterSpacing: '-0.02em' }}>
          {coutEvite.toFixed(2)} <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--color-text-sub)' }}>MAD</span>
        </span>
      </div>
    </div>
  );
};

export default KPIPanel;
