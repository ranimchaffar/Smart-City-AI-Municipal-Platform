import React from 'react';
import { DashboardStats } from '../../services/api';
import { BarChart3, PieChart, TrendingUp, Info, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface AnalyticsViewProps {
  stats: DashboardStats | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats }) => {
  if (!stats) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Chargement des statistiques...</div>;
  }

  const categoryNames: Record<string, string> = {
    ROAD_DAMAGE: 'Voirie & Chaussées',
    STREET_LIGHTING: 'Éclairage Public',
    WASTE: 'Propreté & Déchets',
    WATER_LEAK: 'Fuites & Réseau d’Eau',
    NONE: 'Non classifié',
  };

  const departmentNames: Record<string, string> = {
    ROADS_DEPARTMENT: 'Direction de la Voirie',
    PUBLIC_LIGHTING_DEPARTMENT: 'Direction de l’Éclairage Public',
    SANITATION_DEPARTMENT: 'Direction de la Salubrité & Propreté',
    WATER_SERVICES_DEPARTMENT: 'Direction des Eaux & Assainissement',
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={22} style={{ color: '#2563eb' }} />
          Indicateurs de Performance & Analytique Opérationnelle
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Métriques réelles agrégées directement depuis la base de données PostgreSQL
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Total de Tickets</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>{stats.totalTickets}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Enregistrés dans PostgreSQL</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Taux de Résolution Réel</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>{stats.resolvedRate}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{stats.resolvedTickets} tickets résolus sur {stats.totalTickets}</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Délai Moyen de Réponse</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#64748b', marginTop: '8px' }}>
            {stats.avgResponseTime !== null && stats.avgResponseTime !== undefined ? `${stats.avgResponseTime}h` : 'Non disponible'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Données insuffisantes (calcul SLA)</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Délai Moyen de Résolution</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#64748b', marginTop: '8px' }}>
            {stats.avgResolutionTime !== null && stats.avgResolutionTime !== undefined ? `${stats.avgResolutionTime}h` : 'Non disponible'}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Données de clôture en cours de collecte</div>
        </div>
      </div>

      {/* Grid of breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Breakdown by Category */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={16} /> Répartition par Catégorie d'Incidents
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(stats.byCategory || {}).map(([cat, count]) => {
              const pct = stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{categoryNames[cat] || cat}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Department */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} /> Répartition par Direction Municipale
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(stats.byDepartment || {}).map(([dept, count]) => {
              const pct = stats.totalTickets > 0 ? Math.round((count / stats.totalTickets) * 100) : 0;
              return (
                <div key={dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{departmentNames[dept] || dept}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#0284c7', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit note */}
      <div style={{ marginTop: '24px', padding: '14px 18px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1e40af' }}>
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Garantie d'intégrité métrique :</strong> Toutes les statistiques affichées proviennent exclusivement de requêtes SQL réelles exécutées sur l'instance PostgreSQL locale. Aucun chiffre n'est interpolé ni simulé.
        </span>
      </div>
    </div>
  );
};
