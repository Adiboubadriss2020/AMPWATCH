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
  sparklineData: number[];
}

const Gauge: React.FC<GaugeProps> = ({ label, value, max, unit, color, dimColor, icon, sub, sparklineData }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const sparkW = 80;
  const sparkH = 14;
  const minS = Math.min(...sparklineData);
  const maxS = Math.max(...sparklineData);
  const rangeS = maxS - minS || 1;
  const sparkPoints = sparklineData.map((v, i) => {
    const x = (i / (sparklineData.length - 1)) * sparkW;
    const y = sparkH - ((v - minS) / rangeS) * (sparkH - 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' L ');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.2rem',
      padding: '0.55rem 0.45rem',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--r-lg)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      flex: '1 1 0px',
      minWidth: '110px',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = color;
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 10px ${dimColor}`;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
    }}
    >
      {/* Ring */}
      <div style={{ position: 'relative', width: '52px', height: '52px' }}>
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--color-hairline)" strokeWidth="3.5" />
          <circle
            cx="26" cy="26" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 2px ${color})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.6rem', lineHeight: 1 }}>{icon}</span>
          <span className="mono" style={{ fontSize: '0.65rem', fontWeight: 700, color, lineHeight: 1, marginTop: '1px' }}>
            {value.toFixed(0)}
            <span style={{ fontSize: '0.45rem', fontWeight: 500, color: 'var(--color-text-sub)' }}>{unit}</span>
          </span>
        </div>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--color-text-sub)', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: '0.5rem', color: 'var(--color-text-dim)', marginTop: '1px' }}>
            {sub}
          </div>
        )}
      </div>

      {/* Sparkline at the bottom */}
      <svg width={sparkW} height={sparkH} style={{ overflow: 'visible', marginTop: '0.15rem' }}>
        <path
          d={`M ${sparkPoints}`}
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 1.5px ${color})` }}
        />
      </svg>
    </div>
  );
};

export const KPIPanel: React.FC<KPIPanelProps> = ({ kpis }) => {
  const {
    coutEvite,
    tauxFaussesAlertes,
    disponibiliteFlotte,
    co2Evite,
    scoreUsureMoyen,
  } = kpis;

  const gauges = [
    {
      label: 'Energy Efficiency',
      value: Math.max(0, 100 - scoreUsureMoyen),
      max: 100,
      unit: '%',
      color: 'var(--color-cyan)',
      dimColor: 'rgba(41,211,240,0.25)',
      icon: '⚡',
      sub: 'Grid Optimization',
      sparklineData: [68, 70, 72, 71, 74, 75],
    },
    {
      label: 'Energy Savings',
      value: Math.min(100, co2Evite * 15),
      max: 100,
      unit: '%',
      color: 'var(--color-green)',
      dimColor: 'rgba(63,209,107,0.25)',
      icon: '🌿',
      sub: 'CO2 Offset Rate',
      sparklineData: [24, 28, 30, 29, 31, 32],
    },
    {
      label: 'Cost Reduction',
      value: Math.min(100, coutEvite * 20),
      max: 100,
      unit: '%',
      color: 'var(--color-cyan)',
      dimColor: 'rgba(41,211,240,0.25)',
      icon: '💰',
      sub: 'Avoided Charge',
      sparklineData: [12, 14, 15, 17, 16, 18],
    },
    {
      label: 'Equipment Uptime',
      value: disponibiliteFlotte,
      max: 100,
      unit: '%',
      color: disponibiliteFlotte >= 90 ? 'var(--color-green)' : 'var(--color-amber)',
      dimColor: 'rgba(63,209,107,0.25)',
      icon: '⏱',
      sub: 'Fleet Availability',
      sparklineData: [98, 97, 98, 96, 96, 96],
    },
    {
      label: 'Anomaly Detection',
      value: Math.max(0, 100 - tauxFaussesAlertes),
      max: 100,
      unit: '%',
      color: 'var(--color-cyan)',
      dimColor: 'rgba(41,211,240,0.25)',
      icon: '⚠',
      sub: 'Model Accuracy',
      sparklineData: [80, 82, 85, 83, 86, 85],
    },
    {
      label: 'Data Reliability',
      value: 100,
      max: 100,
      unit: '%',
      color: 'var(--color-green)',
      dimColor: 'rgba(63,209,107,0.25)',
      icon: '🛡',
      sub: 'MQTT Health Index',
      sparklineData: [100, 100, 100, 100, 100, 100],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', letterSpacing: '0.12em', fontWeight: 'bold' }}>
          ◈ KEY METRICS & KPIs ◈
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {gauges.map((g) => (
          <Gauge key={g.label} {...g} />
        ))}
      </div>
    </div>
  );
};
export default KPIPanel;
