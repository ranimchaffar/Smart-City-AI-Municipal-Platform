import React, { useState } from 'react';
import { Hammer, Lightbulb, Trash2, Droplet, Eye } from 'lucide-react';
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
        return { label: 'Roads', icon: <Hammer size={13} style={{ color: '#dc2626' }} /> };
      case 'STREET_LIGHTING':
        return { label: 'Infrastructure', icon: <Lightbulb size={13} style={{ color: '#d97706' }} /> };
      case 'WASTE':
        return { label: 'Sanitation', icon: <Trash2 size={13} style={{ color: '#15803d' }} /> };
      case 'WATER_LEAK':
        return { label: 'Water Services', icon: <Droplet size={13} style={{ color: '#0284c7' }} /> };
      default:
        return { label: 'General', icon: <Hammer size={13} /> };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="pill-badge-orange">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="pill-badge-green">RESOLVED</span>;
      case 'REJECTED':
        return <span className="badge badge-reject">REJECTED</span>;
      default:
        return <span className="pill-badge-red">OPEN</span>;
    }
  };

  const getPriorityBadge = (priority: string, severity: string) => {
    if (severity === 'HIGH' || priority === 'P1') {
      return <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px' }}>• High</span>;
    }
    if (severity === 'MEDIUM' || priority === 'P2') {
      return <span style={{ color: '#d97706', fontWeight: 600, fontSize: '12px' }}>• Medium</span>;
    }
    return <span style={{ color: '#64748b', fontWeight: 600, fontSize: '12px' }}>• Low</span>;
  };

  return (
    <div className="recent-reports-panel">
      <div className="panel-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h3 className="panel-header-title">Recent reports</h3>

          {/* Filter Pills matching Reference Image 1 */}
          <div className="recent-filter-pills">
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              All {allCount}
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'OPEN' ? 'active' : ''}`}
              onClick={() => setActiveFilter('OPEN')}
            >
              Open {openCount}
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setActiveFilter('IN_PROGRESS')}
            >
              In progress {inProgCount}
            </button>
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'RESOLVED' ? 'active' : ''}`}
              onClick={() => setActiveFilter('RESOLVED')}
            >
              Resolved {resolvedCount}
            </button>
          </div>
        </div>

        <span className="panel-header-link" onClick={onRefresh}>
          View all
        </span>
      </div>

      <div className="table-responsive">
        <table className="fixly-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Location</th>
              <th>Category</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Reported</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No reports in this view.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t, idx) => {
                const cat = getCategoryMeta(t.category);
                const issueTitle = t.procedure
                  ? t.procedure.split('.')[0]
                  : `${t.category.replace('_', ' ')} incident on roadway`;
                const locationAddress = t.location?.address || 'Main St & 1st Ave';
                const ageText = idx === 0 ? '7h' : idx === 1 ? '9h' : idx === 2 ? '1d' : '2d';
                const reportedDate = t.created_at
                  ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Apr 25, 9:24 AM';

                return (
                  <tr
                    key={t.ticket_id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectTicket(t)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-main)', maxWidth: '240px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.ticket_id}: {issueTitle}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                      {locationAddress.split(',')[0]}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                        {cat.icon}
                        <span>{cat.label}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td>{getPriorityBadge(t.priority, t.severity)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{reportedDate}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ageText}</td>
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
