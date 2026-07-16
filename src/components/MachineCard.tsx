import React from 'react';
import type { Machine } from '../types';

interface MachineCardProps {
  machine: Machine;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const STATUS_CONFIG = {
  CRITIQUE: {
    color: 'var(--color-red)',
    bg: 'var(--color-red-dim)',
    border: 'var(--color-red)',
    glow: '0 0 14px rgba(255,75,75,0.25)',
    label: 'CRITIQUE',
    dot: '#FF4B4B',
  },
  AVERTISSEMENT: {
    color: 'var(--color-amber)',
    bg: 'var(--color-amber-dim)',
    border: 'var(--color-amber)',
    glow: '0 0 14px rgba(242,184,75,0.20)',
    label: 'WARNING',
    dot: '#F2B84B',
  },
  NOMINAL: {
    color: 'var(--color-green)',
    bg: 'var(--color-green-dim)',
    border: 'transparent',
    glow: 'none',
    label: 'NOMINAL',
    dot: '#3FD16B',
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

  const selectedBorder = isSelected ? 'var(--color-cyan)' : status !== 'NOMINAL' ? cfg.border : 'var(--color-border)';
  const selectedGlow = isSelected ? '0 0 14px rgba(41,211,240,0.20)' : status !== 'NOMINAL' ? cfg.glow : 'none';

  return (
    <button
      onClick={() => onSelect(machineId)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '0.75rem 0.875rem',
        backgroundColor: isSelected ? 'var(--color-overlay)' : 'var(--color-surface)',
        border: `1px solid ${selectedBorder}`,
        borderRadius: 'var(--r-lg)',
        textAlign: 'left',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        gap: '0.45rem',
        boxShadow: selectedGlow,
        transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.15s',
      }}
    >
      {/* Left accent bar */}
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        backgroundColor: isSelected ? 'var(--color-cyan)' : cfg.dot,
        borderRadius: '3px 0 0 3px',
        boxShadow: isSelected ? '0 0 8px rgba(41,211,240,0.6)' : `0 0 8px ${cfg.dot}80`,
      }} />

      {/* Row 1: ID + time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className={status === 'CRITIQUE' ? 'pulse-critical' : ''}
            style={{
              width: '7px', height: '7px', borderRadius: '50%',
              backgroundColor: cfg.dot, display: 'inline-block', flexShrink: 0,
              boxShadow: status !== 'NOMINAL' ? `0 0 6px ${cfg.dot}` : 'none',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              {machineId}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-sub)', marginTop: '1px' }}>{machineName}</div>
          </div>
        </div>
        <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
          {formatTime(timestamp)}
        </span>
      </div>

      {/* Row 2: kW value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingLeft: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
          <span className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: cfg.color, lineHeight: 1, letterSpacing: '-0.02em', textShadow: status !== 'NOMINAL' ? `0 0 10px ${cfg.dot}60` : 'none' }}>
            {kw.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-sub)', fontWeight: 500 }}>kW</span>
        </div>
        {status !== 'NOMINAL' && (
          <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: cfg.color }}>
            {deviationPct > 0 ? `+${deviationPct}` : deviationPct}%
          </span>
        )}
      </div>

      {/* Row 3: status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '0.35rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-sub)' }}>
          {status === 'NOMINAL' ? `Baseline · ${normalKw} kW` : `${deviationPct > 0 ? '+' : ''}${deviationPct}% above limit`}
        </span>
        <span className="badge" style={{
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border !== 'transparent' ? `${cfg.border}60` : 'transparent'}`,
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Cooldown bar */}
      {cooldown_remaining !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.2rem 0.4rem',
          backgroundColor: 'var(--color-amber-dim)',
          border: '1px solid rgba(242,184,75,0.3)',
          borderRadius: 'var(--r-sm)',
          fontSize: '0.65rem', color: 'var(--color-amber)',
          fontFamily: 'var(--font-mono)',
          marginLeft: '0.35rem',
        }}>
          <span>⏱</span>
          <span>Cooldown · {formatCooldown(cooldown_remaining)}</span>
        </div>
      )}
    </button>
  );
};
