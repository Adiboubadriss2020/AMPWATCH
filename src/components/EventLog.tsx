import React from 'react';
import type { EventLogItem } from '../types';

interface EventLogProps {
  events: EventLogItem[];
  onConfirm: (eventId: string, wasReal: boolean) => void;
}

const TAG_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  CRITIQUE:     { color: 'var(--color-red)',   bg: 'var(--color-red-dim)',   border: 'var(--color-red)',   label: 'CRITICAL' },
  AVERTISSEMENT:{ color: 'var(--color-amber)', bg: 'var(--color-amber-dim)', border: 'var(--color-amber)', label: 'WARNING'  },
  resolved:     { color: 'var(--color-green)', bg: 'var(--color-green-dim)', border: 'var(--color-green)', label: 'RESOLVED' },
};
const DEFAULT_TAG = { color: 'var(--color-text-sub)', bg: 'var(--color-overlay)', border: 'var(--color-border)', label: 'INFO' };

export const EventLog: React.FC<EventLogProps> = ({ events, onConfirm }) => {
  return (
    <div className="panel" style={{
      display: 'flex', flexDirection: 'column',
      flexGrow: 1, minHeight: '220px', maxHeight: '340px',
      overflow: 'hidden', padding: '0',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.6rem 0.875rem',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-cyan)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ◈ Live Activity Log
        </span>
        <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {events.length} events
        </span>
      </div>

      {/* Event list */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', flexGrow: 1, gap: '0', padding: '0.25rem 0',
      }}>
        {events.length === 0 ? (
          <div style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 1rem' }}>
            No recent events — fleet operating normally.
          </div>
        ) : (
          events.map((evt) => {
            const cfg = TAG_CONFIG[evt.tag] ?? DEFAULT_TAG;
            const isCritique = evt.tag === 'CRITIQUE';

            return (
              <div key={evt.id} className="fade-in" style={{
                display: 'flex', flexDirection: 'column',
                borderLeft: `3px solid ${cfg.border}`,
                margin: '0.25rem 0.5rem',
                padding: '0.55rem 0.65rem',
                backgroundColor: 'var(--color-overlay)',
                borderRadius: '0 6px 6px 0',
                gap: '0.3rem',
                fontSize: '0.8rem',
                boxShadow: isCritique ? '0 0 10px rgba(255,75,75,0.1)' : 'none',
              }}>
                {/* Meta row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700,
                      backgroundColor: cfg.bg, color: cfg.color,
                      padding: '0.1rem 0.4rem', borderRadius: '3px',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      border: `1px solid ${cfg.border}40`,
                    }}>
                      {cfg.label}
                    </span>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--color-cyan)', fontSize: '0.72rem' }}>
                      {evt.machineId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
                      {evt.time}
                    </span>
                    {/* PDF export icon */}
                    <a
                      href="#"
                      title="Export PDF (Google Docs)"
                      onClick={(e) => { e.preventDefault(); window.open('https://docs.google.com/document/d/1_YOUR_GOOGLE_DOC_ID_HERE/edit?usp=sharing', '_blank'); }}
                      style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Message */}
                <div style={{ color: 'var(--color-text-sub)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                  {evt.message}
                </div>

                {/* Validation actions */}
                {isCritique && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem',
                    marginTop: '0.2rem', paddingTop: '0.3rem', borderTop: '1px dashed var(--color-hairline)',
                  }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', marginRight: 'auto' }}>
                      Energy Manager:
                    </span>
                    {evt.was_real_anomaly == null ? (
                      <>
                        <button
                          onClick={() => onConfirm(evt.id, false)}
                          style={{
                            padding: '0.15rem 0.45rem', fontSize: '0.68rem',
                            background: 'transparent', border: '1px solid var(--color-text-dim)',
                            borderRadius: '4px', color: 'var(--color-text-dim)', cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text)'; e.currentTarget.style.color = 'var(--color-text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-text-dim)'; e.currentTarget.style.color = 'var(--color-text-dim)'; }}
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => onConfirm(evt.id, true)}
                          style={{
                            padding: '0.15rem 0.45rem', fontSize: '0.68rem',
                            background: 'var(--color-cyan-dim)', border: '1px solid var(--color-cyan)',
                            borderRadius: '4px', color: 'var(--color-cyan)', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-cyan)'; e.currentTarget.style.color = '#050B14'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-cyan-dim)'; e.currentTarget.style.color = 'var(--color-cyan)'; }}
                        >
                          Confirm
                        </button>
                      </>
                    ) : evt.was_real_anomaly ? (
                      <span style={{ color: 'var(--color-green)', fontWeight: 600, fontSize: '0.7rem' }}>✓ Confirmed</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem', textDecoration: 'line-through' }}>✗ Dismissed</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
