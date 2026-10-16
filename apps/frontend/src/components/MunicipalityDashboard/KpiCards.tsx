import React from 'react';
import {
  FileText,
  Clock,
  Users,
  Zap,
  CheckCircle2,
  TrendingUp,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { DashboardStats } from '../../services/api';

interface KpiCardsProps {
  stats: DashboardStats | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  // Real values queried from PostgreSQL database
  const total = stats ? stats.totalTickets : 0;
  const open = stats ? stats.openTickets : 0;
  const overdue = stats ? (stats.overdueTickets ?? 0) : 0;
  const unassigned = stats ? (stats.unassignedTickets ?? 0) : 0;
  const resolvedRate = stats ? `${stats.resolvedRate}%` : '0%';
  const resolvedCount = stats ? stats.resolvedTickets : 0;

  // Requirement 5: Display "Non disponible" if insufficient data, do not invent numbers
  const avgResponse =
    stats?.avgResponseTime !== null && stats?.avgResponseTime !== undefined
      ? `${stats.avgResponseTime}h`
      : 'Non disponible';

  return (
    <div className="kpi-row-5">
      {/* 1. TICKETS OUVERTS */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FileText size={16} />
          </div>
          <span className="kpi-label">Tickets Ouverts</span>
        </div>
        <div className="kpi-value">{open.toLocaleString()}</div>
        <div className="kpi-trend" style={{ color: '#2563eb' }}>
          <Activity size={13} />
          <span>Sur {total} tickets au total</span>
        </div>
      </div>

      {/* 2. DÉPASSEMENT SLA */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <Clock size={16} />
          </div>
          <span className="kpi-label">En Dépassement SLA</span>
        </div>
        <div className="kpi-value">{overdue.toLocaleString()}</div>
        <div className="kpi-trend" style={{ color: overdue > 0 ? '#ef4444' : '#16a34a' }}>
          {overdue > 0 ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
          <span>{overdue > 0 ? 'Délai d’échéance dépassé' : 'Aucun dépassement'}</span>
        </div>
      </div>

      {/* 3. NON ASSIGNÉS */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
            <Users size={16} />
          </div>
          <span className="kpi-label">Non Assignés</span>
        </div>
        <div className="kpi-value">{unassigned.toLocaleString()}</div>
        <div className="kpi-trend" style={{ color: '#f97316' }}>
          <TrendingUp size={13} />
          <span>En attente d'attribution</span>
        </div>
      </div>

      {/* 4. DÉLAI MOYEN DE RÉPONSE */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            <Zap size={16} />
          </div>
          <span className="kpi-label">Délai Moyen Réponse</span>
        </div>
        <div className="kpi-value" style={{ fontSize: avgResponse === 'Non disponible' ? '18px' : '28px', color: '#64748b' }}>
          {avgResponse}
        </div>
        <div className="kpi-trend" style={{ color: '#64748b' }}>
          <span>Données en cours de collecte</span>
        </div>
      </div>

      {/* 5. TAUX DE RÉSOLUTION */}
      <div className="kpi-card">
        <div className="kpi-card-top">
          <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle2 size={16} />
          </div>
          <span className="kpi-label">Taux de Résolution</span>
        </div>
        <div className="kpi-value">{resolvedRate}</div>
        <div className="kpi-trend" style={{ color: '#10b981' }}>
          <TrendingUp size={13} />
          <span>{resolvedCount} tickets résolus</span>
        </div>
      </div>
    </div>
  );
};
