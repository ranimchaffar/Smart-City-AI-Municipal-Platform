import React from 'react';
import {
  FileText,
  Clock,
  Users,
  Zap,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { DashboardStats } from '../../services/api';

interface KpiCardsProps {
  stats: DashboardStats | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  // Use real PostgreSQL database statistics
  const total = stats ? stats.totalTickets : 24;
  const overdue = stats ? stats.openTickets : 9;
  const unassigned = stats ? stats.pendingReviews : 7;
  const resolutionRate = stats ? `${stats.resolvedRate}%` : '18h 42m';

  return (
    <div className="kpi-row-5">
      {/* 1. OPEN ISSUES */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FileText size={16} />
          </div>
          <span className="kpi-label">Open Issues</span>
        </div>
        <div className="kpi-value">{total.toLocaleString()}</div>
        <div className="kpi-trend" style={{ color: '#2563eb' }}>
          <TrendingUp size={13} />
          <span>8% vs. last week</span>
        </div>
      </div>

      {/* 2. OVERDUE */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Clock size={16} />
          </div>
          <span className="kpi-label">Overdue</span>
        </div>
        <div className="kpi-value">{overdue.toLocaleString()}</div>
        <div className="kpi-trend" style={{ color: '#ef4444' }}>
          <TrendingUp size={13} />
          <span>15% vs. last week</span>
        </div>
      </div>

      {/* 3. UNASSIGNED */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
            <Users size={16} />
          </div>
          <span className="kpi-label">Unassigned</span>
        </div>
        <div className="kpi-value">{unassigned.toLocaleString()}</div>
        <div className="kpi-trend" style={{ color: '#f97316' }}>
          <TrendingUp size={13} />
          <span>20% vs. last week</span>
        </div>
      </div>

      {/* 4. AVG. RESPONSE TIME */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            <Zap size={16} />
          </div>
          <span className="kpi-label">Avg. Response Time</span>
        </div>
        <div className="kpi-value">10h 24m</div>
        <div className="kpi-trend" style={{ color: '#8b5cf6' }}>
          <TrendingDown size={13} />
          <span>5% vs. last week</span>
        </div>
      </div>

      {/* 5. AVG. RESOLUTION TIME */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 size={16} />
          </div>
          <span className="kpi-label">Avg. Resolution Time</span>
        </div>
        <div className="kpi-value">{resolutionRate}</div>
        <div className="kpi-trend" style={{ color: '#10b981' }}>
          <TrendingDown size={13} />
          <span>7% vs. last week</span>
        </div>
      </div>
    </div>
  );
};
