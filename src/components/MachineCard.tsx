import React from 'react';
import type { Machine } from '../types';

interface MachineCardProps {
  machine: Machine;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const STATUS_CONFIG = {
  CRITIQUE: {
    color: 'var(--color-critical)',
    bg: 'var(--color-red-dim)',
    border: 'var(--color-red)',
    label: 'CRITIQUE',
  },
  AVERTISSEMENT: {
    color: 'var(--color-warning)',
    bg: 'var(--color-amber-dim)',
    border: 'var(--color-amber)',
    label: 'ATTENTION',
  },
  NOMINAL: {
    color: 'var(--color-nominal)',
    bg: 'var(--color-green-dim)',
    border: 'transparent',
    label: 'NOMINAL',
  },
};

export const MachineCard: React.FC<MachineCardProps> = ({ machine, isSelected, onSelect }) => {
  const { machineId, machineName, status, kw, normalKw, timestamp, cooldown_remaining } = machine;

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOMINAL;
  const deviationPct = normalKw > 0 ? Math.round(((kw - normalKw) / normalKw) * 100) : 0;

  const formatTime = (ts: string) => {
    if (ts.includes('T')) return new Date(ts).toTimeString().slice(0, 5);
    return ts.slice(0, 5);
  };

  const formatCooldown = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <button
      onClick={() => onSelect(machineId)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '0.75rem 0.875rem',
        backgroundColor: isSelected ? 'var(--color-overlay)' : 'var(--color-surface)',
        border: `1px solid ${isSelected ? 'var(--color-blue)' : status !== 'NOMINAL' ? cfg.border : 'var(--color-border)'}`,
        borderRadius: 'var(--r-lg)',
        textAlign: 'left',
        transition: 'border-color 0.15s, background-color 0.15s',
        gap: '0.5rem',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Selected accent bar */}
      {isSelected && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            backgroundColor: 'var(--color-blue)',
            borderRadius: '3px 0 0 3px',
          }}
        />
      )}

      {/* ── Row 1: ID + time ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className={status === 'CRITIQUE' ? 'pulse-critical' : ''}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: cfg.color,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
              {machineId}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-sub)', marginTop: '1px' }}>
              {machineName}
            </div>
          </div>
        </div>
        <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
          {formatTime(timestamp)}
        </span>
      </div>

      {/* ── Row 2: kW reading + deviation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
          <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1 }}>
            {kw.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-sub)', fontWeight: 500 }}>kW</span>
        </div>

        {status !== 'NOMINAL' && (
          <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: cfg.color }}>
            {deviationPct > 0 ? `+${deviationPct}` : deviationPct}%
          </span>
        )}
      </div>

      {/* ── Row 3: status badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-sub)' }}>
          {status === 'NOMINAL' ? `Nominal · ${normalKw} kW baseline` : `${deviationPct > 0 ? '+' : ''}${deviationPct}% above limit`}
        </span>
        <span
          className="badge"
          style={{
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border !== 'transparent' ? cfg.border : cfg.bg}`,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* ── Cooldown suppression bar ── */}
      {cooldown_remaining !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.4rem',
            backgroundColor: 'var(--color-amber-dim)',
            border: '1px solid var(--color-amber)',
            borderRadius: 'var(--r-sm)',
            fontSize: '0.68rem',
            color: 'var(--color-amber)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>⏱</span>
          <span>Suppression active · {formatCooldown(cooldown_remaining)} restant</span>
        </div>
      )}
    </button>
  );
};
