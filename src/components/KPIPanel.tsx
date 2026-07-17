import React from 'react';
import type { KPIs } from '../types';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { useFlashOnChange } from '../hooks/useFlashOnChange';
import {
  IconAnomaly,
  IconCost,
  IconDetection,
  IconUptime,
} from './Icons';

interface KPIPanelProps {
  kpis: KPIs;
}

interface Metric {
  label: string;
  value: number;
  decimals: number;
  unit?: string;
  hint: string;
  color: string;
  icon: React.ReactNode;
}

function KPITile({
  label,
  value,
  decimals,
  unit,
  hint,
  color,
  icon,
  index,
}: Metric & { index: number }) {
  const animated = useAnimatedNumber(value);
  const flash = useFlashOnChange(`${label}:${value.toFixed(decimals)}`);
  const shown =
    decimals === 0 ? String(Math.round(animated)) : animated.toFixed(decimals);

  return (
    <div
      className={`kpi-tile widget-enter${flash ? ' is-flash' : ''}`}
      style={{ borderTopColor: color, animationDelay: `${0.04 + index * 0.05}s` }}
    >
      <div className="kpi-label-row">
        <span className="widget-icon" style={{ color }} aria-hidden>
          {icon}
        </span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value-row">
        <span className="mono kpi-value" style={{ color }}>
          {shown}
        </span>
        {unit && <span className="mono kpi-unit">{unit}</span>}
      </div>
      <span className="kpi-hint">{hint}</span>
    </div>
  );
}

export const KPIPanel: React.FC<KPIPanelProps> = ({ kpis }) => {
  const {
    coutEvite,
    tempsDetection,
    anomaliesSemaine,
    disponibiliteFlotte,
  } = kpis;

  const metrics: Metric[] = [
    {
      label: 'Cost avoided',
      value: coutEvite,
      decimals: 2,
      unit: 'MAD',
      hint: '(normalKw − kw) × tarif × h',
      color: 'var(--color-cyan)',
      icon: <IconCost size={15} />,
    },
    {
      label: 'Uptime',
      value: Math.round(disponibiliteFlotte),
      decimals: 0,
      unit: '%',
      hint: 'Nominal time / day time',
      color: disponibiliteFlotte >= 80 ? 'var(--color-green)' : 'var(--color-amber)',
      icon: <IconUptime size={15} />,
    },
    {
      label: 'Anomalies',
      value: anomaliesSemaine,
      decimals: 0,
      hint: 'Live event count',
      color: anomaliesSemaine > 0 ? 'var(--color-red)' : 'var(--color-green)',
      icon: <IconAnomaly size={15} />,
    },
    {
      label: 'Detection',
      value: tempsDetection,
      decimals: 1,
      unit: 's',
      hint: 'Avg flag latency',
      color: 'var(--color-cyan)',
      icon: <IconDetection size={15} />,
    },
  ];

  return (
    <div className="kpi-strip kpi-strip--4 widget-stagger">
      {metrics.map((m, i) => (
        <KPITile key={m.label} {...m} index={i} />
      ))}
    </div>
  );
};

export default KPIPanel;
