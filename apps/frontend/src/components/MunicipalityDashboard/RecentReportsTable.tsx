import React, { useState } from 'react';
import { Hammer, Lightbulb, Trash2, Droplet, Eye, User, Calendar, MapPin } from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface RecentReportsTableProps {
  tickets: TicketDemo[];
  onSelectTicket: (ticket: TicketDemo) => void;
  onRefresh?: () => void;
}

export const RecentReportsTable: React.FC<RecentReportsTableProps> = ({
  tickets,
  onSelectTicket,
  onRefresh,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OPEN') return t.status === 'TICKET_CREATED' || t.status === 'ASSIGNED';
    if (activeFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (activeFilter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  const allCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'TICKET_CREATED' || t.status === 'ASSIGNED').length;
  const inProgCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'ROAD_DAMAGE':
        return { label: 'Voirie & Chaussée', icon: <Hammer size={13} style={{ color: '#dc2626' }} /> };
      case 'STREET_LIGHTING':
        return { label: 'Éclairage Public', icon: <Lightbulb size={13} style={{ color: '#d97706' }} /> };
      case 'WASTE':
        return { label: 'Propreté Urbaine', icon: <Trash2 size={13} style={{ color: '#15803d' }} /> };
      case 'WATER_LEAK':
        return { label: 'Réseau d’Eau', icon: <Droplet size={13} style={{ color: '#0284c7' }} /> };
      default:
        return { label: 'Général', icon: <Hammer size={13} /> };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="pill-badge-orange">EN COURS</span>;
      case 'RESOLVED':
        return <span className="pill-badge-green">RÉSOLU</span>;
      case 'REJECTED':
        return <span className="badge badge-reject">REJETÉ</span>;
      default:
        return <span className="pill-badge-red">OUVERT</span>;
    }
  };

  const getPriorityBadge = (priority: string, severity: string) => {
    if (severity === 'HIGH' || priority === 'HIGH' || priority === 'P1') {
      return <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px' }}>• Haute</span>;
    }
    if (severity === 'MEDIUM' || priority === 'NORMAL' || priority === 'P2') {
      return <span style={{ color: '#d97706', fontWeight: 600, fontSize: '12px' }}>• Moyenne</span>;
    }
    return <span style={{ color: '#64748b', fontWeight: 600, fontSize: '12px' }}>• Basse</span>;
  };

  return (
    <div className="recent-reports-panel">
      <div className="panel-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h3 className="panel-header-title">Signalements récents</h3>

          {/* Filter Pills */}
          <div className="recent-filter-pills">
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              Tous {allCount}
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'OPEN' ? 'active' : ''}`}
              onClick={() => setActiveFilter('OPEN')}
            >
              Ouverts {openCount}
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setActiveFilter('IN_PROGRESS')}
            >
              En cours {inProgCount}
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'RESOLVED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('RESOLVED')}
            >
              Résolus {resolvedCount}
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive-wrapper">
        <table className="recent-reports-table">
          <thead>
            <tr>
              <th>N° TICKET</th>
              <th>DATE</th>
              <th>LOCALISATION</th>
              <th>CATÉGORIE</th>
              <th>PRIORITÉ</th>
              <th>STATUT</th>
              <th>AFFECTÉ À</th>
              <th style={{ textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucun ticket ne correspond au filtre sélectionné.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const catMeta = getCategoryMeta(t.category);
                const dateStr = t.created_at
                  ? new Date(t.created_at).toLocaleDateString('fr-FR')
                  : 'Aujourd’hui';

                return (
                  <tr
                    key={t.ticket_id}
                    onClick={() => onSelectTicket(t)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="ticket-id-clean">{t.ticket_id}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {dateStr}
                      </span>
                    </td>
                    <td>
                      <div className="loc-main">
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--text-muted)' }} />
                        {t.location?.address ? t.location.address.split(',')[0] : 'Tunis'}
                      </div>
                      <div className="loc-sub">
                        {t.location?.latitude && t.location?.longitude
                          ? `${t.location.latitude.toFixed(4)}, ${t.location.longitude.toFixed(4)}`
                          : 'Grand Tunis'}
                      </div>
                    </td>
                    <td>
                      <span className="cat-pill">
                        {catMeta.icon}
                        <span>{catMeta.label}</span>
                      </span>
                    </td>
                    <td>{getPriorityBadge(t.priority, t.severity)}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: t.assigned_agent_name ? '#1e3a8a' : 'var(--text-muted)' }}>
                        {t.assigned_agent_name ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} />
                            {t.assigned_agent_name}
                          </span>
                        ) : (
                          'Non affecté'
                        )}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                      >
                        <Eye size={12} />
                        Consulter
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
