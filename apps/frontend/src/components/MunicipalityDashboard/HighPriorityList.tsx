import React from 'react';
import {
  Hammer,
  Lightbulb,
  FileText,
  Trash2,
  AlertTriangle,
  UserCheck,
  MoreVertical,
  Clock,
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
  // Take up to 5 tickets (or sample fallback if list is short)
  const displayTickets = tickets.slice(0, 5);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ROAD_DAMAGE':
        return {
          icon: <Hammer size={16} />,
          bg: '#fee2e2',
          color: '#dc2626',
        };
      case 'STREET_LIGHTING':
        return {
          icon: <Lightbulb size={16} />,
          bg: '#fef3c7',
          color: '#d97706',
        };
      case 'WASTE':
        return {
          icon: <Trash2 size={16} />,
          bg: '#dcfce7',
          color: '#15803d',
        };
      default:
        return {
          icon: <AlertTriangle size={16} />,
          bg: '#f3e8ff',
          color: '#7e22ce',
        };
    }
  };

  const getPriorityBadge = (priority: string, severity: string) => {
    if (severity === 'HIGH' || priority === 'P1') {
      return <span className="pill-badge-red">• High</span>;
    }
    if (severity === 'MEDIUM' || priority === 'P2') {
      return <span className="pill-badge-orange">Medium</span>;
    }
    return <span className="badge badge-low">• Low</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="pill-badge-orange">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="pill-badge-green">RESOLVED</span>;
      default:
        return <span className="pill-badge-red">OPEN</span>;
    }
  };

  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-header-title">
          <span>High-priority issues</span>
          <span className="pill-badge-red">• High</span>
        </div>
        <span className="panel-header-link" onClick={onViewAll}>
          View all
        </span>
      </div>

      <div className="issues-list">
        {displayTickets.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No high-priority issues pending.
          </div>
        ) : (
          displayTickets.map((t, idx) => {
            const catStyle = getCategoryIcon(t.category);
            const remainingHours = idx === 0 ? '7h left' : idx === 1 ? '2h left' : idx === 2 ? '5.8d left' : '7h left';
            const coordsText = t.location?.latitude && t.location?.longitude
              ? `${t.location.latitude}, ${t.location.longitude}`
              : t.location?.address || '38.7652, -9.1120';

            return (
              <div
                key={t.ticket_id}
                className="issue-row"
                onClick={() => onSelectTicket(t)}
                title="Click to view details and update status"
              >
                <div
                  className="issue-category-icon"
                  style={{ background: catStyle.bg, color: catStyle.color }}
                >
                  {catStyle.icon}
                </div>

                <div className="issue-info">
                  <div className="issue-title">
                    {t.location?.address ? `${t.category.replace('_', ' ')} — ${t.location.address.split(',')[0]}` : `${t.category.replace('_', ' ')} incident`}
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
                    <Clock size={12} />
                    {remainingHours}
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
                    <span>Assign</span>
                  </button>

                  <button
                    type="button"
                    className="btn-icon-dots"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(t);
                    }}
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
        <span>Showing 1-{displayTickets.length} of {tickets.length} high-priority issues</span>
      </div>
    </div>
  );
};
