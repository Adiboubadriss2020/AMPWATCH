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

            let badgeBg = 'rgba(124, 135, 152, 0.1)';
            let badgeColor = 'var(--color-muted)';
            let badgeLabel: string = evt.tag;

            if (isCritique) {
              badgeBg = 'rgba(255, 77, 94, 0.1)';
              badgeColor = 'var(--color-red)';
              badgeLabel = 'CRITICAL';
            } else if (isAvertissement) {
              badgeBg = 'rgba(242, 174, 61, 0.1)';
              badgeColor = 'var(--color-amber)';
              badgeLabel = 'WARNING';
            } else if (isResolved) {
              badgeBg = 'rgba(47, 217, 140, 0.1)';
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
                  backgroundColor: 'rgba(25, 32, 45, 0.5)',
                  border: '1px solid var(--color-hairline)',
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
                  <span className="timestamp" style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    {evt.time}
                  </span>
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
                      borderTop: '1px dashed rgba(35, 43, 56, 0.5)'
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
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
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
                            backgroundColor: 'rgba(62, 142, 255, 0.1)',
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
                            e.currentTarget.style.backgroundColor = 'rgba(62, 142, 255, 0.1)';
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
