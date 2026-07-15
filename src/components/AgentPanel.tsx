import React, { useState } from 'react';
import type { AgentRecommendation, AgentNode } from '../types';

interface AgentPanelProps {
  recommendations: AgentRecommendation[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

// Map node type → color + emoji label
const NODE_TYPE_META: Record<string, { color: string; bg: string; icon: string }> = {
  trigger:   { color: 'var(--color-blue)',  bg: 'rgba(62,142,255,0.1)',  icon: '⚡' },
  action:    { color: 'var(--color-amber)', bg: 'rgba(242,174,61,0.1)',  icon: '⚙️' },
  'agent-llm': { color: '#a855f7',          bg: 'rgba(168,85,247,0.1)',  icon: '🧠' },
  agent:     { color: '#a855f7',            bg: 'rgba(168,85,247,0.1)',  icon: '🤖' },
  display:   { color: 'var(--color-muted)', bg: 'rgba(124,135,152,0.1)', icon: '📋' },
  utility:   { color: 'var(--color-green)', bg: 'rgba(47,217,140,0.1)',  icon: '🔀' },
};

function NodeCard({ node }: { node: AgentNode }) {
  const [expanded, setExpanded] = useState(false);
  const meta = NODE_TYPE_META[node.type] ?? NODE_TYPE_META['display'];
  const hasParams = node.data.parameters && Object.keys(node.data.parameters).length > 0;

  return (
    <div
      style={{
        border: `1px solid ${meta.color}44`,
        borderRadius: '8px',
        padding: '0.65rem 0.75rem',
        backgroundColor: meta.bg,
        marginBottom: '0.5rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '1rem' }}>{meta.icon}</span>
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
            border: `1px solid ${meta.color}55`,
          }}
        >
          {node.type}
        </span>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)' }}>
          {node.data.label}
        </span>
      </div>

      {/* Description */}
      <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.4 }}>
        {node.data.description}
      </p>

      {/* Parameters expand */}
      {hasParams && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: meta.color,
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0',
              textDecoration: 'underline',
            }}
          >
            {expanded ? '▲ Masquer les paramètres' : '▼ Voir les paramètres'}
          </button>

          {expanded && (
            <pre
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: 'rgba(0,0,0,0.25)',
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

function RecommendationCard({
  rec,
  onMarkRead,
}: {
  rec: AgentRecommendation;
  onMarkRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(!rec.isRead);

  const handleConsult = () => {
    setExpanded(!expanded);
    if (!rec.isRead) onMarkRead(rec.id);
  };

  return (
    <div
      style={{
        border: `1px solid ${rec.isRead ? 'var(--color-hairline)' : 'rgba(255,77,94,0.4)'}`,
        borderRadius: '10px',
        padding: '0.85rem',
        marginBottom: '0.85rem',
        backgroundColor: rec.isRead ? 'rgba(25,32,45,0.4)' : 'rgba(255,77,94,0.04)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          {!rec.isRead && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--color-red)',
                backgroundColor: 'rgba(255,77,94,0.12)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                marginRight: '0.4rem',
                textTransform: 'uppercase',
              }}
            >
              ● NOUVEAU
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
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          {new Date(rec.receivedAt).toLocaleTimeString('fr-FR')}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
          <b style={{ color: 'var(--color-text)' }}>{rec.nodes.length}</b> nœuds
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
          <b style={{ color: 'var(--color-text)' }}>{rec.edges.length}</b> connexions
        </span>
      </div>

      {/* Consult button */}
      <button
        onClick={handleConsult}
        style={{
          width: '100%',
          padding: '0.4rem 0.75rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          backgroundColor: expanded ? 'rgba(62,142,255,0.15)' : 'rgba(62,142,255,0.08)',
          border: '1px solid var(--color-blue)',
          borderRadius: '6px',
          color: 'var(--color-blue)',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          marginBottom: expanded ? '0.75rem' : '0',
          textAlign: 'left',
        }}
      >
        {expanded ? '▲ Masquer le workflow agent' : '▼ Consulter le workflow agent'}
      </button>

      {/* Node list */}
      {expanded && (
        <div style={{ marginTop: '0.25rem' }}>
          {rec.nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
          {rec.edges.length > 0 && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.65rem',
                backgroundColor: 'rgba(25,32,45,0.5)',
                borderRadius: '6px',
                border: '1px solid var(--color-hairline)',
              }}
            >
              <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Connexions ({rec.edges.length})
              </p>
              {rec.edges.map((e) => (
                <div key={e.id} style={{ fontSize: '0.7rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--color-blue)' }}>{e.source.slice(0, 8)}…</span>
                  {' → '}
                  <span style={{ color: 'var(--color-green)' }}>{e.target.slice(0, 8)}…</span>
                </div>
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
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 200,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Slide-in Drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 92vw)',
          backgroundColor: 'rgba(13,17,27,0.98)',
          borderLeft: '1px solid var(--color-hairline)',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.6)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Panel Header */}
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
              🤖 Recommandations Agent IA
            </h2>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              Workflows déclenchés lors d'anomalies détectées
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-hairline)',
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

        {/* Unread count bar */}
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
            {unread} nouvelle{unread > 1 ? 's' : ''} recommandation{unread > 1 ? 's' : ''} non lue{unread > 1 ? 's' : ''}
          </div>
        )}

        {/* Scrollable list */}
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
                color: 'var(--color-muted)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🤖</span>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                Aucune recommandation pour l'instant.
                <br />
                Les analyses IA apparaîtront ici lors d'anomalies.
              </p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} onMarkRead={onMarkRead} />
            ))
          )}
        </div>

        {/* Footer */}
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
          AMPWATCH · AGENT WORKFLOW INSPECTOR v1.0
        </div>
      </aside>
    </>
  );
};
