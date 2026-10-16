import React from 'react';
import {
  Hammer,
  Lightbulb,
  FileText,
  Trash2,
  AlertTriangle,
  UserCheck,
  MoreVertical,
  Calendar,
} from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface HighPriorityListProps {
  tickets: TicketDemo[];
  onSelectTicket: (ticket: TicketDemo) => void;
  onViewAll: () => void;
}

export const HighPriorityList: React.FC<HighPriorityListProps> = ({
  tickets,
  onSelectTicket,
  onViewAll,
}) => {
  // Filter or take high priority tickets
  const highPriorityTickets = tickets.filter(
    (t) => t.priority === 'HIGH' || t.severity === 'HIGH'
  );
  const displayTickets = (highPriorityTickets.length > 0 ? highPriorityTickets : tickets).slice(0, 5);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ROAD_DAMAGE':
        return {
          icon: <Hammer size={16} />,
          bg: '#fee2e2',
          color: '#dc2626',
          label: 'Voirie & Chaussée',
        };
      case 'STREET_LIGHTING':
        return {
          icon: <Lightbulb size={16} />,
          bg: '#fef3c7',
          color: '#d97706',
          label: 'Éclairage Public',
        };
      case 'WASTE':
        return {
          icon: <Trash2 size={16} />,
          bg: '#dcfce7',
          color: '#15803d',
          label: 'Propreté Urbaine',
        };
      case 'WATER_LEAK':
        return {
          icon: <AlertTriangle size={16} />,
          bg: '#e0f2fe',
          color: '#0284c7',
          label: 'Réseau d’Eau',
        };
      default:
        return {
          icon: <AlertTriangle size={16} />,
          bg: '#f3e8ff',
          color: '#7e22ce',
          label: 'Autre',
        };
    }
  };

  const getPriorityBadge = (priority: string, severity: string) => {
    if (severity === 'HIGH' || priority === 'HIGH' || priority === 'P1') {
      return <span className="pill-badge-red">• Haute</span>;
    }
    if (severity === 'MEDIUM' || priority === 'NORMAL' || priority === 'P2') {
      return <span className="pill-badge-orange">Moyenne</span>;
    }
    return <span className="badge badge-low">• Basse</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="pill-badge-orange">EN COURS</span>;
      case 'RESOLVED':
        return <span className="pill-badge-green">RÉSOLU</span>;
      default:
        return <span className="pill-badge-red">OUVERT</span>;
    }
  };

  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-header-title">
          <span>Incidents prioritaires</span>
          <span className="pill-badge-red">• Priorité Haute</span>
        </div>
        <span className="panel-header-link" onClick={onViewAll} style={{ cursor: 'pointer' }}>
          Tout afficher
        </span>
      </div>

      <div className="issues-list">
        {displayTickets.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Aucun incident prioritaire en attente.
          </div>
        ) : (
          displayTickets.map((t) => {
            const catStyle = getCategoryIcon(t.category);
            const coordsText = t.location?.latitude && t.location?.longitude
              ? `${t.location.latitude}, ${t.location.longitude}`
              : t.location?.address || 'Tunis';

            const createdDate = t.created_at
              ? new Date(t.created_at).toLocaleDateString('fr-FR')
              : 'Récent';

            return (
              <div
                key={t.ticket_id}
                className="issue-row"
                onClick={() => onSelectTicket(t)}
                title="Cliquer pour afficher la fiche et modifier le statut"
              >
                <div
                  className="issue-category-icon"
                  style={{ background: catStyle.bg, color: catStyle.color }}
                >
                  {catStyle.icon}
                </div>

                <div className="issue-info">
                  <div className="issue-title">
                    {t.location?.address
                      ? `${catStyle.label} — ${t.location.address.split(',')[0]}`
                      : `${catStyle.label} (${t.ticket_id})`}
                  </div>
                  <div className="issue-coords">{coordsText}</div>
                </div>

                <div className="issue-actions">
                  {getPriorityBadge(t.priority, t.severity)}

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Calendar size={12} />
                    {createdDate}
                  </span>

                  {getStatusBadge(t.status)}

                  <button
                    type="button"
                    className="btn-assign-dropdown"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(t);
                    }}
                  >
                    <UserCheck size={12} />
                    <span>Affecter</span>
                  </button>

                  <button
                    type="button"
                    className="btn-icon-dots"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(t);
                    }}
                    title="Options"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          marginTop: '16px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Affichage de 1 à {displayTickets.length} sur {tickets.length} tickets enregistrés
        </span>
      </div>
    </div>
  );
};
