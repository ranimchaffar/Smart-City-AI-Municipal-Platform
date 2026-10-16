import React from 'react';
import { Map, MapPin, CheckCircle, Clock, ShieldCheck, Compass } from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface TransparencyMapProps {
  tickets: TicketDemo[];
}

const CATEGORY_NAMES: Record<string, string> = {
  ROAD_DAMAGE: 'Voirie & Chaussée',
  STREET_LIGHTING: 'Éclairage Public',
  WASTE: 'Propreté & Déchets',
  WATER_LEAK: 'Assainissement & Eau',
};

const DEPT_NAMES: Record<string, string> = {
  ROADS_DEPARTMENT: 'Direction Voirie',
  PUBLIC_LIGHTING_DEPARTMENT: 'Éclairage Public',
  SANITATION_DEPARTMENT: 'Propreté Urbaine',
  WATER_SERVICES_DEPARTMENT: 'Service des Eaux',
};

const STATUS_LABELS: Record<string, string> = {
  TICKET_CREATED: 'Reçu',
  ASSIGNED: 'Affecté',
  IN_PROGRESS: 'En Cours',
  RESOLVED: 'Résolu',
  REJECTED: 'Rejeté',
};

export const TransparencyMap: React.FC<TransparencyMapProps> = ({ tickets }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Compass size={20} style={{ color: 'var(--primary)' }} />
            Cartographie Opérationnelle &amp; Transparence Urbaine
          </h3>
          <p className="form-hint">
            Vue géographique en temps réel des interventions de maintenance sur le territoire métropolitain.
          </p>
        </div>

        <span className="badge badge-info">Flux Télémétrie Civique</span>
      </div>

      {/* Simulated Map Visualizer */}
      <div
        style={{
          height: '240px',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.06), rgba(5, 150, 105, 0.08))',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <Map size={48} style={{ color: 'var(--primary)', opacity: 0.8, marginBottom: '10px' }} />
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
          Radar Métropolitain des Interventions Urbaines (Grand Tunis)
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '520px', marginTop: '4px' }}>
          Signalements géoréférencés : Avenue Habib Bourguiba, Marché Central, Rue de Rome, et Boulevard du 14 Janvier.
        </div>
      </div>

      {/* Incident Cards by District */}
      <div className="grid-2">
        {tickets.slice(0, 6).map((t) => (
          <div
            key={t.ticket_id}
            style={{
              padding: '14px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: t.status === 'RESOLVED' ? 'var(--status-pass-subtle)' : 'var(--primary-subtle)',
                color: t.status === 'RESOLVED' ? 'var(--status-pass)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={18} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.88rem' }}>{t.location?.address || 'Secteur Métropolitain'}</strong>
                <span className="badge badge-pass" style={{ fontSize: '0.68rem' }}>
                  {STATUS_LABELS[t.status] || t.status}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {CATEGORY_NAMES[t.category] || t.category} • {DEPT_NAMES[t.department] || t.department}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Réf : <code>{t.ticket_id}</code> • SLA : {t.deadline ? new Date(t.deadline).toLocaleDateString('fr-FR') : 'Standard 48h'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
