import React from 'react';
import type { Machine } from '../types';
import { formatLabel } from '../formatLabel';
import { useFlashOnChange } from '../hooks/useFlashOnChange';
import {
  IconBaseline,
  IconCo2,
  IconCost,
  IconDrift,
  IconHealth,
  IconMaintenance,
  IconShift,
  IconTariff,
  IconWear,
} from './Icons';

interface AssetHealthPanelProps {
  machine: Machine;
  waiting?: boolean;
  offHoursOnLabel?: string;
}

function Tile({
  label,
  value,
  accent,
  delay = 0,
  icon,
}: {
  label: string;
  value: string;
  accent?: string;
  delay?: number;
  icon: React.ReactNode;
}) {
  const flash = useFlashOnChange(`${label}:${value}`);

  return (
    <div
      className={`ah-tile widget-enter${flash ? ' is-flash' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="ah-tile-label-row">
        <span className="widget-icon" style={{ color: accent || 'var(--color-text-sub)' }} aria-hidden>
          {icon}
        </span>
        <span className="ah-tile-label">{label}</span>
      </div>
      <span className="mono ah-tile-value" style={{ color: accent || 'var(--color-text)' }} title={value}>
        {value}
      </span>
    </div>
  );
}

export const AssetHealthPanel: React.FC<AssetHealthPanelProps> = ({
  machine,
  waiting = false,
  offHoursOnLabel = '0m',
}) => {
  const wear = waiting ? 0 : (machine.scoreUsure ?? 0);
  const wearColor =
    wear > 80 ? 'var(--color-red)' : wear > 50 ? 'var(--color-amber)' : 'var(--color-green)';
  const driftColor = !waiting && machine.driftAlerte ? 'var(--color-amber)' : 'var(--color-green)';
  const devColor = !waiting && Math.abs(machine.deviation) > 15 ? 'var(--color-red)' : 'var(--color-text)';
  const advisoryFlash = useFlashOnChange(
    `${machine.driftMessage || ''}|${machine.conseilTarif || ''}|${machine.driftAlerte}|${waiting}`,
  );

  const dash = '—';
  const baseline = waiting
    ? `0.0/0 · 0%`
    : `${machine.kw.toFixed(1)}/${machine.normalKw} · ${machine.deviation > 0 ? '+' : ''}${machine.deviation}%`;
  // YES = API stopped (no new samples) · NO = receiving live data
  const offHoursAlert = !waiting && machine.horsProduction === true;
  const offHours = waiting ? dash : offHoursAlert ? 'YES' : 'NO';
  const drift = waiting ? dash : machine.driftAlerte ? 'ALERT' : 'Stable';

  return (
    <div
      className="panel panel--live widget-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        padding: '0.55rem 0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span className="section-label" style={{ margin: 0 }}>
          <span className="widget-icon"><IconHealth size={14} /></span>
          Economics · Wear · Drift
        </span>
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-text)', fontWeight: 600 }}>
          {waiting ? 'Waiting for API…' : ([machine.date, machine.time].filter(Boolean).join(' ') || dash)}
        </span>
      </div>

      <div
        className="asset-health-grid widget-stagger"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '0.4rem',
        }}
      >
        <Tile
          label="Vs baseline"
          value={baseline}
          accent={devColor}
          delay={0.02}
          icon={<IconBaseline size={13} />}
        />
        <Tile label="Wear" value={`${wear}/100`} accent={wearColor} delay={0.06} icon={<IconWear size={13} />} />
        <Tile
          label="Maintenance"
          value={waiting ? dash : (machine.prochaineMaintenance || dash)}
          delay={0.1}
          icon={<IconMaintenance size={13} />}
        />
        <Tile
          label="Cost / h"
          value={waiting ? '0.00 MAD' : `${machine.costPerHour.toFixed(2)} MAD`}
          accent="var(--color-cyan)"
          delay={0.14}
          icon={<IconCost size={13} />}
        />
        <Tile
          label="Tariff"
          value={waiting ? `0.00 · ${dash}` : `${(machine.tarifKwh ?? 0).toFixed(2)} · ${formatLabel(machine.trancheHoraire)}`}
          accent={!waiting && machine.trancheHoraire === 'HEURES_PLEINES' ? 'var(--color-amber)' : 'var(--color-green)'}
          delay={0.18}
          icon={<IconTariff size={13} />}
        />
        <Tile
          label="CO₂ / h"
          value={`${waiting ? 0 : (machine.co2ParHeure ?? 0).toFixed(2)} kg`}
          accent="var(--color-green)"
          delay={0.22}
          icon={<IconCo2 size={13} />}
        />
        <Tile
          label="CO₂ / day"
          value={`${waiting ? 0 : (machine.co2ParJour ?? 0).toFixed(2)} kg`}
          delay={0.26}
          icon={<IconCo2 size={13} />}
        />
      </div>

      <div
        className="asset-health-alerts"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto 1fr',
          gap: '0.4rem',
          alignItems: 'stretch',
        }}
      >
        <Tile
          label="Off-Hours (Hors prod)"
          value={offHoursAlert ? `YES · ${offHoursOnLabel}` : offHours}
          accent={offHoursAlert ? 'var(--color-red)' : 'var(--color-green)'}
          delay={0.34}
          icon={<IconShift size={13} />}
        />
        <Tile
          label="Drift"
          value={drift}
          accent={driftColor}
          delay={0.38}
          icon={<IconDrift size={13} />}
        />
        <div
          className={`ah-advisory${!waiting && machine.driftAlerte ? ' is-alert' : ''}${advisoryFlash ? ' is-flash' : ''}`}
        >
          {waiting && (
            <span style={{ color: 'var(--color-text-sub)' }}>Waiting for API…</span>
          )}
          {!waiting && machine.driftMessage && (
            <span style={{ color: driftColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {machine.driftMessage}
            </span>
          )}
          {!waiting && machine.conseilTarif && (
            <span
              style={{
                color: 'var(--color-cyan)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginLeft: 'auto',
              }}
            >
              {machine.conseilTarif}
            </span>
          )}
          {!waiting && !machine.driftMessage && !machine.conseilTarif && (
            <span style={{ color: 'var(--color-text-sub)' }}>No advisory</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetHealthPanel;
