import React, { useState } from 'react';
import type { AgentInsight, AgentRecommendation, AgentNode } from '../types';

interface AgentPanelProps {
  recommendations: AgentRecommendation[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NODE_TYPE_META: Record<string, { color: string; bg: string }> = {
  trigger: { color: 'var(--color-blue)', bg: 'var(--color-blue-dim)' },
  action: { color: 'var(--color-amber)', bg: 'var(--color-amber-dim)' },
  'agent-llm': { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  agent: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  display: { color: 'var(--color-text-sub)', bg: 'var(--color-bg-subtle)' },
  utility: { color: 'var(--color-green)', bg: 'var(--color-green-dim)' },
};

function riskTone(risque: string, score: number | null): { color: string; bg: string; label: string } {
  const r = risque.toLowerCase();
  const s = score ?? 0;
  if (r.includes('critique') || r.includes('critical') || s >= 85) {
    return { color: 'var(--color-red)', bg: 'var(--color-red-dim)', label: risque || 'critique' };
  }
  if (r.includes('elev') || r.includes('high') || s >= 60) {
    return { color: 'var(--color-amber)', bg: 'var(--color-amber-dim)', label: risque || 'élevé' };
  }
  if (r.includes('mod') || r.includes('moyen') || s >= 35) {
    return { color: 'var(--color-blue)', bg: 'var(--color-blue-dim)', label: risque || 'modéré' };
  }
  return { color: 'var(--color-green)', bg: 'var(--color-green-dim)', label: risque || 'faible' };
}

function Section({
  title,
  children,
  accent = 'var(--color-muted)',
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  if (!children) return null;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p
        style={{
          margin: '0 0 0.3rem 0',
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: accent,
        }}
      >
        {title}
      </p>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function NodeCard({ node }: { node: AgentNode }) {
  const [expanded, setExpanded] = useState(false);
  const meta = NODE_TYPE_META[node.type] ?? NODE_TYPE_META.display;
  const hasParams = node.data.parameters && Object.keys(node.data.parameters).length > 0;

  return (
    <div
      style={{
        borderTop: `1px solid ${meta.color}44`,
        borderRight: `1px solid ${meta.color}44`,
        borderBottom: `1px solid ${meta.color}44`,
        borderLeft: `1px solid ${meta.color}44`,
        borderRadius: '8px',
        padding: '0.65rem 0.75rem',
        backgroundColor: meta.bg,
        marginBottom: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: meta.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0.1rem 0.35rem',
            backgroundColor: meta.bg,
            borderRadius: '4px',
            borderTop: `1px solid ${meta.color}55`,
            borderRight: `1px solid ${meta.color}55`,
            borderBottom: `1px solid ${meta.color}55`,
            borderLeft: `1px solid ${meta.color}55`,
          }}
        >
          {node.type}
        </span>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)' }}>
          {node.data.label}
        </span>
      </div>
      <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.4 }}>
        {node.data.description}
      </p>
      {hasParams && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: meta.color,
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            {expanded ? '▲ Hide parameters' : '▼ View parameters'}
          </button>
          {expanded && (
            <pre
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'var(--color-text)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                lineHeight: 1.45,
              }}
            >
              {JSON.stringify(node.data.parameters, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

function InsightBody({ insight }: { insight: AgentInsight }) {
  const tone = riskTone(insight.risque_panne, insight.score_risque);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.85rem',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: tone.color,
            backgroundColor: tone.bg,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Risque {tone.label}
          {insight.score_risque != null ? ` · ${insight.score_risque}` : ''}
        </span>
        {insight.prediction_panne_jours != null && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--color-text-sub)',
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Panne ~{insight.prediction_panne_jours}j
          </span>
        )}
        {insight.perte_estimee_jour != null && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--color-red)',
              backgroundColor: 'var(--color-red-dim)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            −{insight.perte_estimee_jour.toFixed(2)} €/j
          </span>
        )}
      </div>

      {insight.diagnostic && (
        <Section title="Diagnostic" accent="var(--color-red)">
          {insight.diagnostic}
        </Section>
      )}
      {insight.cause_probable && (
        <Section title="Cause probable" accent="var(--color-amber)">
          {insight.cause_probable}
        </Section>
      )}
      {insight.action_immediate && (
        <Section title="Action immédiate" accent="var(--color-red)">
          <div
            style={{
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-red-dim)',
              borderLeft: '3px solid var(--color-red)',
            }}
          >
            {insight.action_immediate}
          </div>
        </Section>
      )}
      {insight.action_planifiee && (
        <Section title="Action planifiée" accent="var(--color-blue)">
          {insight.action_planifiee}
        </Section>
      )}
      {insight.conseil_economie && (
        <Section title="Conseil économie" accent="var(--color-green)">
          {insight.conseil_economie}
        </Section>
      )}
      {insight.impact_co2 && (
        <Section title="Impact CO₂" accent="var(--color-cyan)">
          {insight.impact_co2}
        </Section>
      )}
      {insight.recommandation_hitl && (
        <Section title="Validation humaine (HITL)" accent="var(--color-blue)">
          <div
            style={{
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-blue-dim)',
              borderLeft: '3px solid var(--color-blue)',
            }}
          >
            {insight.recommandation_hitl}
          </div>
        </Section>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  onMarkRead,
}: {
  rec: AgentRecommendation;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(!rec.isRead);
  const hasInsight = Boolean(rec.insight);
  const hasGraph = rec.nodes.length > 0;
  const tone = riskTone(rec.insight?.risque_panne ?? '', rec.insight?.score_risque ?? null);

  const handleConsult = () => {
    setExpanded(!expanded);
    if (!rec.isRead) onMarkRead(rec.id);
  };

  return (
    <div
      style={{
        borderTop: `1px solid ${rec.isRead ? 'var(--color-border)' : tone.color}`,
        borderRight: `1px solid ${rec.isRead ? 'var(--color-border)' : tone.color}`,
        borderBottom: `1px solid ${rec.isRead ? 'var(--color-border)' : tone.color}`,
        borderLeft: `3px solid ${rec.isRead ? 'var(--color-border)' : tone.color}`,
        borderRadius: '10px',
        padding: '0.85rem',
        marginBottom: '0.85rem',
        backgroundColor: rec.isRead ? 'var(--color-overlay)' : tone.bg,
        transition: 'border-color 0.3s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.5rem',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
          {!rec.isRead && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--color-red)',
                backgroundColor: 'rgba(255,77,94,0.12)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              ● NEW
            </span>
          )}
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--color-blue)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {rec.machineId}
          </span>
          {hasInsight && rec.insight?.score_risque != null && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: tone.color,
                fontFamily: 'var(--font-mono)',
              }}
            >
              score {rec.insight.score_risque}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
          {new Date(rec.receivedAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      {hasInsight && rec.insight?.diagnostic && !expanded && (
        <p
          style={{
            margin: '0 0 0.6rem 0',
            fontSize: '0.78rem',
            color: 'var(--color-text-sub)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {rec.insight.diagnostic}
        </p>
      )}

      {!hasInsight && hasGraph && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            <b style={{ color: 'var(--color-text)' }}>{rec.nodes.length}</b> nodes
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            <b style={{ color: 'var(--color-text)' }}>{rec.edges.length}</b> connections
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleConsult}
        style={{
          width: '100%',
          padding: '0.4rem 0.75rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          backgroundColor: expanded ? 'rgba(62,142,255,0.15)' : 'rgba(62,142,255,0.08)',
          borderTop: '1px solid var(--color-blue)',
          borderRight: '1px solid var(--color-blue)',
          borderBottom: '1px solid var(--color-blue)',
          borderLeft: '1px solid var(--color-blue)',
          borderRadius: '6px',
          color: 'var(--color-blue)',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          marginBottom: expanded ? '0.75rem' : 0,
          textAlign: 'left',
        }}
      >
        {expanded
          ? '▲ Masquer le conseil agent'
          : hasInsight
            ? '▼ Afficher le conseil agent'
            : '▼ View Agent Workflow'}
      </button>

      {expanded && (
        <div style={{ marginTop: '0.25rem' }}>
          {hasInsight && rec.insight && <InsightBody insight={rec.insight} />}

          {hasGraph && (
            <div style={{ marginTop: hasInsight ? '0.75rem' : 0 }}>
              {hasInsight && (
                <p
                  style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                  }}
                >
                  Workflow ({rec.nodes.length})
                </p>
              )}
              {rec.nodes.map((node) => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ recommendations, isOpen, onClose, onMarkRead }) => {
  const unread = recommendations.filter((r) => !r.isRead).length;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--color-shadow)',
            zIndex: 200,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 92vw)',
          backgroundColor: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-12px 0 48px var(--color-shadow)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-hairline)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Conseils Agent IA
            </h2>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              Temps réel · historique des anomalies
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              borderTop: '1px solid var(--color-hairline)',
              borderRight: '1px solid var(--color-hairline)',
              borderBottom: '1px solid var(--color-hairline)',
              borderLeft: '1px solid var(--color-hairline)',
              color: 'var(--color-muted)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {unread > 0 && (
          <div
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'rgba(255,77,94,0.08)',
              borderBottom: '1px solid rgba(255,77,94,0.2)',
              fontSize: '0.78rem',
              color: 'var(--color-red)',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {unread} nouveau{unread > 1 ? 'x' : ''} conseil{unread > 1 ? 's' : ''} non lu
            {unread > 1 ? 's' : ''}
          </div>
        )}

        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {recommendations.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '0.75rem',
                color: 'var(--color-text-dim)',
                textAlign: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-border-hi)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4M8 15h.01M16 15h.01" />
              </svg>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--color-text-sub)' }}>
                Aucun conseil pour le moment.
                <br />
                Les analyses agent apparaîtront ici à chaque anomalie.
              </p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} onMarkRead={onMarkRead} />
            ))
          )}
        </div>

        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--color-hairline)',
            fontSize: '0.7rem',
            color: 'var(--color-muted)',
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
          }}
        >
          EnerGenius · AGENT LIVE · {recommendations.length} conseil{recommendations.length !== 1 ? 's' : ''}
        </div>
      </aside>
    </>
  );
};
