import React, { useState } from 'react';
import { TicketDemo, updateTicketStatus, UserProfile } from '../../services/api';
import {
  Wrench,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface WorkOrdersViewProps {
  tickets: TicketDemo[];
  currentUser: UserProfile | null;
  onSelectTicket: (ticket: TicketDemo) => void;
  onRefresh: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  tickets,
  currentUser,
  onSelectTicket,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'>('IN_PROGRESS');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const workOrders = tickets.filter((t) => {
    const matchesFilter =
      filter === 'ALL'
        ? ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(t.status)
        : t.status === filter;

    const matchesAgent =
      !myTasksOnly ||
      (currentUser &&
        (t.assigned_to === currentUser.id ||
          (currentUser.name && t.assigned_agent_name === currentUser.name)));

    return matchesFilter && matchesAgent;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Résolu</span>;
      case 'IN_PROGRESS':
        return <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>En cours</span>;
      default:
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Affecté</span>;
    }
  };

  const getDepartmentLabel = (dept: string) => {
    const map: Record<string, string> = {
      ROADS_DEPARTMENT: 'Voirie & Chaussées',
      PUBLIC_LIGHTING_DEPARTMENT: 'Éclairage Public',
      SANITATION_DEPARTMENT: 'Propreté & Déchets',
      WATER_SERVICES_DEPARTMENT: 'Réseau d’Eau Potable',
    };
    return map[dept] || dept;
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={22} style={{ color: '#2563eb' }} />
            Ordres de Mission & Interventions Terrain
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Suivi des fiches de travaux actives confiées aux équipes municipales
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {currentUser && currentUser.role === 'MUNICIPAL_AGENT' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginRight: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={myTasksOnly}
                onChange={(e) => setMyTasksOnly(e.target.checked)}
              />
              Mes tâches uniquement
            </label>
          )}

          <button
            onClick={() => setFilter('IN_PROGRESS')}
            className={`btn btn-sm ${filter === 'IN_PROGRESS' ? 'btn-primary' : 'btn-secondary'}`}
          >
            En cours ({tickets.filter((t) => t.status === 'IN_PROGRESS').length})
          </button>
          <button
            onClick={() => setFilter('ASSIGNED')}
            className={`btn btn-sm ${filter === 'ASSIGNED' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Affectés ({tickets.filter((t) => t.status === 'ASSIGNED').length})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`btn btn-sm ${filter === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Résolus ({tickets.filter((t) => t.status === 'RESOLVED').length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Tous
          </button>
        </div>
      </div>

      {workOrders.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: '15px', fontWeight: 600 }}>Aucun ordre de mission dans cette catégorie.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {workOrders.map((t) => (
            <div
              key={t.ticket_id}
              onClick={() => onSelectTicket(t)}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                  {t.ticket_id}
                </span>
                {getStatusBadge(t.status)}
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                {getDepartmentLabel(t.department)}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MapPin size={13} />
                <span>{t.location?.address || 'Tunis'}</span>
              </div>

              {t.assigned_agent_name && (
                <div style={{ fontSize: '12px', color: '#1e3a8a', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <User size={12} />
                  <span>Agent assigné : {t.assigned_agent_name}</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: t.priority === 'HIGH' ? '#b91c1c' : 'var(--text-muted)', fontWeight: t.priority === 'HIGH' ? 700 : 500 }}>
                  Priorité : {t.priority === 'HIGH' ? 'Haute' : t.priority === 'NORMAL' ? 'Normale' : 'Basse'}
                </span>
                <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Détails & Actions <ExternalLink size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
