import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Machine } from '../types';
import { formatLabel } from '../formatLabel';
import { IconAnomaly } from './Icons';

export interface AnomalyEvent {
  id: string;
  time: string;
  machineId: string;
  machineName: string;
  anomalyType: string;
  severity: string;
  status: Machine['status'];
  scenario: string;
  kw: number;
  normalKw: number;
  deviation: number;
  message: string;
}

interface AnomalyAlertProps {
  events: AnomalyEvent[];
  onClear?: () => void;
}

function severityColor(status: string, severity: string): string {
  if (status === 'CRITIQUE' || severity === 'CRITIQUE') return 'var(--color-red)';
  if (status === 'AVERTISSEMENT' || severity === 'ATTENTION') return 'var(--color-amber)';
  return 'var(--color-green)';
}

const NEAR_TOP_PX = 24;

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ events, onClear }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(events.length);
  const prevScrollRef = useRef({ top: 0, height: 0 });
  const [pendingNew, setPendingNew] = useState(0);

  // Snapshot scroll before DOM updates when list grows
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // First paint: seed snapshot
    if (prevScrollRef.current.height === 0 && el.scrollHeight > 0) {
      prevScrollRef.current = { top: el.scrollTop, height: el.scrollHeight };
      prevLenRef.current = events.length;
      return;
    }

    const prevLen = prevLenRef.current;
    const grew = events.length > prevLen;
    const added = grew ? events.length - prevLen : 0;
    const wasAwayFromTop = prevScrollRef.current.top > NEAR_TOP_PX;

    if (grew && wasAwayFromTop) {
      // Keep viewport where the user was looking (compensate for prepended items)
      const { top, height } = prevScrollRef.current;
      const delta = el.scrollHeight - height;
      el.scrollTop = top + Math.max(0, delta);
      setPendingNew((n) => n + added);
    } else if (grew) {
      setPendingNew(0);
    }

    prevLenRef.current = events.length;
    prevScrollRef.current = { top: el.scrollTop, height: el.scrollHeight };
  }, [events]);

  // Track scroll continuously for next snapshot
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      prevScrollRef.current = { top: el.scrollTop, height: el.scrollHeight };
      if (el.scrollTop <= NEAR_TOP_PX) setPendingNew(0);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Clear pending when list is emptied
  useEffect(() => {
    if (events.length === 0) setPendingNew(0);
  }, [events.length]);

  const jumpToLatest = () => {
    const el = listRef.current;
    if (el) el.scrollTop = 0;
    setPendingNew(0);
  };

  return (
    <div
      className="panel panel--live widget-enter"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        minHeight: '240px',
        maxHeight: '320px',
        height: '100%',
        border: events.length > 0 ? '1px solid rgba(255,75,75,0.35)' : '1px solid var(--color-hairline)',
        boxShadow: events.some((e) => e.status === 'CRITIQUE') ? 'var(--glow-red)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.75rem 0.85rem',
          borderBottom: '1px solid var(--color-hairline)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-red)' }}>
          <span className="widget-icon" style={{ color: 'var(--color-red)' }}>
            <IconAnomaly size={15} />
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Live Anomaly Events
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--color-text)', fontWeight: 600 }}>
            {events.length} event{events.length === 1 ? '' : 's'}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={() => {
                setPendingNew(0);
                onClear();
              }}
              disabled={events.length === 0}
              title="Clear all live anomalies"
              style={{
                background: events.length === 0 ? 'transparent' : 'var(--color-red-dim)',
                border: `1px solid ${events.length === 0 ? 'var(--color-hairline)' : 'var(--color-red)'}`,
                color: events.length === 0 ? 'var(--color-text)' : 'var(--color-red)',
                borderRadius: '6px',
                padding: '0.2rem 0.55rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: events.length === 0 ? 'default' : 'pointer',
                opacity: events.length === 0 ? 0.5 : 1,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {pendingNew > 0 && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="fade-in mono"
            style={{
              position: 'absolute',
              top: '0.55rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 5,
              border: '1px solid var(--color-red)',
              background: 'var(--color-surface)',
              color: 'var(--color-red)',
              boxShadow: 'var(--glow-red)',
              borderRadius: '999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            New anomaly +{pendingNew}
          </button>
        )}

        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            padding: '0.55rem',
            minHeight: 0,
          }}
        >
          {events.length === 0 ? (
            <div
              style={{
                color: 'var(--color-text)',
                fontSize: '0.8rem',
                textAlign: 'center',
                padding: '2.5rem 1rem',
              }}
            >
              No anomalies yet — waiting for live events…
            </div>
          ) : (
            events.map((evt, i) => {
              const color = severityColor(evt.status, evt.severity);
              const isLatest = i === 0;
              return (
                <div
                  key={evt.id}
                  className={`event-card${isLatest ? ' is-latest' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    padding: '0.65rem 0.7rem',
                    backgroundColor: isLatest ? 'rgba(255,75,75,0.06)' : 'var(--color-overlay)',
                    borderTop: `1px solid ${isLatest ? color : 'var(--color-hairline)'}`,
                    borderRight: `1px solid ${isLatest ? color : 'var(--color-hairline)'}`,
                    borderBottom: `1px solid ${isLatest ? color : 'var(--color-hairline)'}`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: '0 8px 8px 0',
                    boxShadow: isLatest ? `0 0 12px ${color}22` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.58rem',
                          fontWeight: 700,
                          color,
                          backgroundColor: `${color}18`,
                          border: `1px solid ${color}55`,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {formatLabel(evt.severity || evt.status)}
                      </span>
                      <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-cyan)' }}>
                        {evt.machineId}
                      </span>
                      {isLatest && (
                        <span
                          style={{
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            color: 'var(--color-red)',
                            letterSpacing: '0.06em',
                          }}
                        >
                          LIVE
                        </span>
                      )}
                    </div>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-text)', flexShrink: 0, fontWeight: 600 }}>
                      {evt.time}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--color-text-sub)', fontWeight: 600 }}>{evt.machineName}</span>
                    <span className="mono" style={{ color, fontWeight: 700 }}>
                      {evt.kw.toFixed(1)} kW · {evt.deviation > 0 ? '+' : ''}
                      {evt.deviation}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-sub)', fontWeight: 500 }}>
                    Baseline {evt.normalKw} kW
                  </div>

                  {evt.message && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.76rem',
                        lineHeight: 1.4,
                        color: 'var(--color-text)',
                        borderTop: '1px solid var(--color-hairline)',
                        paddingTop: '0.35rem',
                      }}
                    >
                      {evt.message}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomalyAlert;
