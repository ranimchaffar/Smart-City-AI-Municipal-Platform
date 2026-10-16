import React from 'react';
import { Ticket, AlertCircle, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DashboardStats } from '../../services/api';

interface KpiCardsProps {
  stats: DashboardStats | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid-4" style={{ marginBottom: '24px' }}>
      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
          <Ticket size={24} />
        </div>
        <div>
          <div className="stat-value">{stats.totalTickets}</div>
          <div className="stat-label">Total Tickets Persistants</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Base PostgreSQL active</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'var(--status-review-subtle)', color: 'var(--status-review)' }}>
          <AlertCircle size={24} />
        </div>
        <div>
          <div className="stat-value">{stats.pendingReviews}</div>
          <div className="stat-label">En Attente de Modération</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--status-review)' }}>Escalades garde-fous</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'var(--status-info-subtle)', color: 'var(--status-info)' }}>
          <Clock size={24} />
        </div>
        <div>
          <div className="stat-value">{stats.inProgressTickets + stats.assignedTickets}</div>
          <div className="stat-label">Interventions en Cours</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Services municipaux mobilisés</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ background: 'var(--status-pass-subtle)', color: 'var(--status-pass)' }}>
          <CheckCircle2 size={24} />
        </div>
        <div>
          <div className="stat-value">{stats.resolvedTickets}</div>
          <div className="stat-label">Incidents Clôturés ({stats.resolvedRate}%)</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--status-pass)' }}>Taux de résolution métropolitain</span>
        </div>
      </div>
    </div>
  );
};
