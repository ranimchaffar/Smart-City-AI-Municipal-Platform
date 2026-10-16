import React, { useState } from 'react';
import { Search, Filter, Eye, ArrowUpDown, RefreshCw, Layers } from 'lucide-react';
import { TicketDemo } from '../../services/api';

interface TicketTableProps {
  tickets: TicketDemo[];
  onSelectTicket: (ticket: TicketDemo) => void;
  onRefresh: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  ROAD_DAMAGE: 'Voirie & Chaussée',
  STREET_LIGHTING: 'Éclairage Public',
  WASTE: 'Propreté & Déchets',
  WATER_LEAK: 'Assainissement & Eau',
};

const DEPARTMENT_LABELS: Record<string, string> = {
  ROADS_DEPARTMENT: 'Direction de la Voirie',
  PUBLIC_LIGHTING_DEPARTMENT: 'Service Éclairage Public',
  SANITATION_DEPARTMENT: 'Direction de la Propreté',
  WATER_SERVICES_DEPARTMENT: 'Service des Eaux',
};

const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  TICKET_CREATED: { label: 'Ticket Reçu', badgeClass: 'badge-info' },
  ASSIGNED: { label: 'Équipe Affectée', badgeClass: 'badge-review' },
  IN_PROGRESS: { label: 'En Cours', badgeClass: 'badge-review' },
  RESOLVED: { label: 'Résolu & Clôturé', badgeClass: 'badge-pass' },
  REJECTED: { label: 'Rejeté / Sans Suite', badgeClass: 'badge-reject' },
};

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  onSelectTicket,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredTickets = tickets.filter((t) => {
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (departmentFilter && t.department !== departmentFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.ticket_id.toLowerCase().includes(q) ||
        t.report_id.toLowerCase().includes(q) ||
        (t.procedure && t.procedure.toLowerCase().includes(q)) ||
        (t.location?.address && t.location.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Registre Centralisé des Incidents Métropolitains</h3>
          <p className="form-hint">
            Consultation et suivi en direct des tickets créés et persistés dans la base PostgreSQL.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
          <RefreshCw size={14} />
          Actualiser le Registre
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher par N° Ticket, Réf. Signalement, adresse ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Toutes les Catégories</option>
            <option value="ROAD_DAMAGE">Voirie &amp; Chaussée</option>
            <option value="STREET_LIGHTING">Éclairage Public</option>
            <option value="WASTE">Propreté &amp; Déchets</option>
            <option value="WATER_LEAK">Assainissement &amp; Eau</option>
          </select>
        </div>

        <div>
          <select
            className="form-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Tous les Services Métropolitains</option>
            <option value="ROADS_DEPARTMENT">Direction de la Voirie</option>
            <option value="PUBLIC_LIGHTING_DEPARTMENT">Service Éclairage Public</option>
            <option value="SANITATION_DEPARTMENT">Direction de la Propreté</option>
            <option value="WATER_SERVICES_DEPARTMENT">Service des Eaux</option>
          </select>
        </div>

        <div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les Statuts</option>
            <option value="TICKET_CREATED">Ticket Reçu (TICKET_CREATED)</option>
            <option value="ASSIGNED">Équipe Affectée (ASSIGNED)</option>
            <option value="IN_PROGRESS">En Cours d'Intervention (IN_PROGRESS)</option>
            <option value="RESOLVED">Résolu (RESOLVED)</option>
            <option value="REJECTED">Rejeté (REJECTED)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Ticket</th>
              <th>Réf. Signalement</th>
              <th>Catégorie</th>
              <th>Service Affecté</th>
              <th>Sévérité</th>
              <th>Priorité</th>
              <th>Statut d'Intervention</th>
              <th>Enregistré le</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Aucun ticket ne correspond aux critères de recherche actuels.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const statusMeta = STATUS_LABELS[t.status] || {
                  label: t.status,
                  badgeClass: 'badge-pass',
                };
                return (
                  <tr key={t.ticket_id} style={{ cursor: 'pointer' }} onClick={() => onSelectTicket(t)}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      {t.ticket_id}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t.report_id}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{CATEGORY_LABELS[t.category] || t.category}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {DEPARTMENT_LABELS[t.department] || t.department}
                    </td>
                    <td>
                      <span className={`badge badge-${t.severity.toLowerCase()}`}>{t.severity}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{t.priority}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusMeta.badgeClass}`} style={{ fontSize: '0.72rem' }}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t);
                        }}
                        style={{ padding: '4px 10px' }}
                      >
                        <Eye size={14} />
                        Détails
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
