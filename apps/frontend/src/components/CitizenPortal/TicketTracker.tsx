import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, AlertCircle, Building, MapPin, Calendar, FileText, ChevronRight } from 'lucide-react';
import { fetchReportWithTracking, fetchTicketById, TicketDemo, TicketEvent } from '../../services/api';

const STATUS_MAP: Record<string, { label: string; badge: string; desc: string }> = {
  RECEIVED: { label: 'Signalement Reçu', badge: 'badge-info', desc: 'Dossier enregistré dans le registre municipal.' },
  VALIDATING: { label: 'Instruction en Cours', badge: 'badge-info', desc: 'Vérification automatisée par les agents IA.' },
  ANALYZING: { label: 'Analyse Technique', badge: 'badge-info', desc: 'Évaluation visuelle et cartographique.' },
  REVIEW_REQUIRED: { label: 'En File de Modération', badge: 'badge-review', desc: 'Dossier orienté vers les agents municipaux pour arbitrage.' },
  TICKET_CREATED: { label: 'Ticket Officiel Émis', badge: 'badge-pass', desc: 'Incident validé et inscrit au planning d\'intervention.' },
  ASSIGNED: { label: 'Équipes Affectées', badge: 'badge-info', desc: 'Dossier transmis au chef de brigade du secteur.' },
  IN_PROGRESS: { label: 'Intervention sur Site', badge: 'badge-info', desc: 'Équipes municipales mobilisées sur le terrain.' },
  RESOLVED: { label: 'Travaux Achevés / Résolu', badge: 'badge-pass', desc: 'Intervention terminée avec succès et vérifiée.' },
  REJECTED: { label: 'Classé sans Suite', badge: 'badge-reject', desc: 'Signalement non recevable ou doublon clôturé.' },
};

const DEPARTMENT_LABELS: Record<string, string> = {
  ROADS_DEPARTMENT: 'Direction de la Voirie et des Espaces Publics',
  PUBLIC_LIGHTING_DEPARTMENT: 'Direction de l\'Éclairage Public et des Réseaux',
  SANITATION_DEPARTMENT: 'Direction de la Propreté et de l\'Hygiène Urbaine',
  WATER_SERVICES_DEPARTMENT: 'Direction de l\'Assainissement et des Eaux',
};

export const TicketTracker: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<{ ticket: TicketDemo; events: TicketEvent[] } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setTicketData(null);

    const q = searchQuery.trim();

    try {
      if (q.startsWith('TKT-')) {
        const res = await fetchTicketById(q);
        setTicketData(res);
      } else {
        const repRes = await fetchReportWithTracking(q, tokenInput.trim() || undefined);
        if (repRes.ticket) {
          setTicketData({ ticket: repRes.ticket, events: repRes.events || [] });
        } else if (repRes.reviewCase) {
          setError(`Le dossier ${q} est actuellement en attente d'arbitrage dans la File de Modération Humaine (Réf : ${repRes.reviewCase.review_id}).`);
        } else {
          setError(`Le signalement ${q} a été reçu mais aucun ticket d'intervention n'a été émis.`);
        }
      }
    } catch (err: any) {
      setError(err.message || `Le dossier "${q}" n'a pas été trouvé ou requiert un jeton de suivi valide.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '960px', margin: '24px auto 0' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Search size={22} style={{ color: 'var(--primary)' }} />
            Suivi d'Intervention en Temps Réel
          </h3>
          <p className="form-hint">
            Consultez à tout moment l'état d'avancement des travaux communaux grâce à votre référence de dossier.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="N° de Ticket (TKT-...) ou Référence (RPT-...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 240px', fontFamily: 'var(--font-mono)' }}
          required
        />
        <input
          type="text"
          className="form-input"
          placeholder="Jeton secret de suivi (requis pour signalement anonyme)"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          style={{ flex: '1 1 260px', fontFamily: 'var(--font-mono)' }}
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flexShrink: 0, padding: '10px 20px' }}>
          {isLoading ? 'Recherche...' : 'Rechercher le Dossier'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-review-subtle)',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            color: 'var(--status-review)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {ticketData && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Référence Officielle du Ticket</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                {ticketData.ticket.ticket_id}
              </div>
            </div>
            <span className={`badge ${STATUS_MAP[ticketData.ticket.status]?.badge || 'badge-info'}`} style={{ fontSize: '0.88rem', padding: '6px 14px' }}>
              {STATUS_MAP[ticketData.ticket.status]?.label || ticketData.ticket.status}
            </span>
          </div>

          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div>
                <div className="stat-label">Typologie d'Incident</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>
                  {ticketData.ticket.category.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-label">Direction Municipale Affectée</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginTop: '2px' }}>
                  {DEPARTMENT_LABELS[ticketData.ticket.department] || ticketData.ticket.department}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-label">Échéance Réglementaire (SLA)</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>
                  {ticketData.ticket.deadline
                    ? new Date(ticketData.ticket.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Délai standard (5 jours ouvrés)'}
                </div>
              </div>
            </div>
          </div>

          {ticketData.ticket.location?.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              <span>Localisation d'intervention : <strong>{ticketData.ticket.location.address}</strong></span>
            </div>
          )}

          {/* Chronologie Historique d'Intervention */}
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              Historique des Opérations (Journal d'Audit Immuable) :
            </h4>

            <div className="timeline">
              {ticketData.events && ticketData.events.length > 0 ? (
                ticketData.events.map((evt, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-dot ${evt.to_status === 'RESOLVED' ? 'resolved' : evt.to_status === 'TICKET_CREATED' ? 'created' : 'review'}`} />
                    <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.88rem' }}>
                          {STATUS_MAP[evt.to_status]?.label || evt.to_status}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {new Date(evt.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {evt.notes || `Transition de statut : ${evt.from_status || 'DÉBUT'} → ${evt.to_status}`}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Opérateur : <code>{evt.actor}</code>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Signalement initialement enregistré. En attente de mise à jour des équipes techniques.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
