import React from 'react';
import type { EventLogItem } from '../types';

interface EventLogProps {
  events: EventLogItem[];
  onConfirm: (eventId: string, wasReal: boolean) => void;
}

export const EventLog: React.FC<EventLogProps> = ({ events, onConfirm }) => {
  return (
    <div 
      className="panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '240px',
        overflow: 'hidden',
        padding: '1rem',
      }}
    >
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '0.5rem' }}>
        Live Activity Log
      </h3>

      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flexGrow: 1,
          gap: '0.5rem',
          paddingRight: '0.25rem'
        }}
      >
        {events.length === 0 ? (
          <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
            No recent events. Fleet operating normally.
          </div>
        ) : (
          events.map((evt) => {
            const isCritique = evt.tag === 'CRITIQUE';
            const isAvertissement = evt.tag === 'AVERTISSEMENT';
            const isResolved = evt.tag === 'resolved';

            let badgeBg = 'var(--color-overlay)';
            let badgeColor = 'var(--color-text-sub)';
            let badgeLabel: string = evt.tag;

            if (isCritique) {
              badgeBg = 'var(--color-red-dim)';
              badgeColor = 'var(--color-red)';
              badgeLabel = 'CRITICAL';
            } else if (isAvertissement) {
              badgeBg = 'var(--color-amber-dim)';
              badgeColor = 'var(--color-amber)';
              badgeLabel = 'WARNING';
            } else if (isResolved) {
              badgeBg = 'var(--color-green-dim)';
              badgeColor = 'var(--color-green)';
              badgeLabel = 'RESOLVED';
            }

            return (
              <div 
                key={evt.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-overlay)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                }}
              >
                {/* Meta Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        backgroundColor: badgeBg, 
                        color: badgeColor, 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {badgeLabel}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-blue)' }}>
                      {evt.machineId}
                    </span>
                  </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="timestamp" style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        {evt.time}
                      </span>
                      <a
                        href="#"
                        title="Export PDF (Google Docs)"
                        onClick={(e) => { e.preventDefault(); window.open('https://docs.google.com/document/d/1_YOUR_GOOGLE_DOC_ID_HERE/edit?usp=sharing', '_blank'); }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <svg 
                          width="13" 
                          height="13" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="var(--color-red)" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </a>
                    </div>
                </div>

                {/* Message */}
                <div style={{ color: 'var(--color-text)', lineHeight: '1.35' }}>
                  {evt.message}
                </div>

                {/* AI Validation Actions — Section 4.3 */}
                {isCritique && (
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end', 
                      gap: '0.5rem', 
                      marginTop: '0.25rem',
                      paddingTop: '0.35rem',
                      borderTop: '1px dashed var(--color-border)'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginRight: 'auto' }}>
                      Energy Manager Validation:
                    </span>

                    {evt.was_real_anomaly == null ? (
                      <>
                        <button
                          onClick={() => onConfirm(evt.id, false)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-muted)',
                            borderRadius: '4px',
                            color: 'var(--color-muted)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--color-text)';
                            e.currentTarget.style.backgroundColor = 'var(--color-overlay)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--color-muted)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Dismiss (False Alert)
                        </button>
                        <button
                          onClick={() => onConfirm(evt.id, true)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--color-blue-dim)',
                            border: '1px solid var(--color-blue)',
                            borderRadius: '4px',
                            color: 'var(--color-blue)',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--color-blue)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'var(--color-blue-dim)';
                            e.currentTarget.style.color = 'var(--color-blue)';
                          }}
                        >
                          Confirm Anomaly
                        </button>
                      </>
                    ) : evt.was_real_anomaly ? (
                      <span style={{ color: 'var(--color-green)', fontWeight: 600, fontSize: '0.75rem' }}>
                        ✓ Anomaly Confirmed
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-muted)', textDecoration: 'line-through', fontSize: '0.75rem' }}>
                        ✗ False Alert Dismissed
                      </span>
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
