import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Building,
  Shield,
  MapPin,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  TicketDemo,
  TicketEvent,
  fetchTicketById,
  updateTicketStatus,
} from '../../services/api';

interface TicketDetailDrawerProps {
  ticketId: string;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  ROAD_DAMAGE: 'Voirie & Chaussée',
  STREET_LIGHTING: 'Éclairage Public',
  WASTE: 'Propreté & Déchets',
  WATER_LEAK: 'Assainissement & Eau',
};

const DEPT_NAMES: Record<string, string> = {
  ROADS_DEPARTMENT: 'Direction de la Voirie',
  PUBLIC_LIGHTING_DEPARTMENT: 'Service Éclairage Public',
  SANITATION_DEPARTMENT: 'Direction de la Propreté',
  WATER_SERVICES_DEPARTMENT: 'Service des Eaux',
};

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticketId,
  onClose,
  onStatusUpdated,
}) => {
  const [ticket, setTicket] = useState<TicketDemo | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [actorName, setActorName] = useState('agent_superviseur_tunis');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTicketById(ticketId);
      setTicket(data.ticket);
      setEvents(data.events || []);
      setNewStatus(data.ticket.status);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de charger les détails du ticket');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !ticket) return;

    setIsUpdating(true);
    setErrorMessage(null);
    try {
      await updateTicketStatus(
        ticket.ticket_id,
        newStatus,
        actorName.trim() || 'superviseur_municipal',
        notes.trim() || undefined
      );
      setNotes('');
      await loadTicket();
      onStatusUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la transition de statut');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Chargement des détails du ticket...
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="card-header" style={{ marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="card-title" style={{ fontFamily: 'var(--font-mono)' }}>
                {ticket.ticket_id}
              </h2>
              <span className="badge badge-pass">{ticket.status}</span>
            </div>
            <span className="form-hint">
              Réf. Signalement Citoyen : <code>{ticket.report_id}</code> • Persistance PostgreSQL :{' '}
              <strong>{ticket.persisted ? 'Confirmée' : 'Simulée'}</strong>
            </span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="badge badge-reject" style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Meta Grid */}
        <div className="grid-3" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div>
              <div className="stat-label">Catégorie d'Incident</div>
              <div style={{ fontWeight: 700 }}>{CATEGORY_NAMES[ticket.category] || ticket.category}</div>
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Direction Municipale Affectée</div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                {DEPT_NAMES[ticket.department] || ticket.department}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Sévérité / Priorité</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <span className={`badge badge-${ticket.severity.toLowerCase()}`}>{ticket.severity}</span>
                <span className="badge badge-info">{ticket.priority}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anonymized Media & Location */}
        <div className="grid-2" style={{ marginBottom: '20px' }}>
          {/* Media Reference */}
          <div style={{ background: 'var(--surface-raised)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Shield size={16} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '0.88rem' }}>Preuve Multimédia &amp; Bouclier RGPD</strong>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Référence Stockage : <code className="code-block" style={{ padding: '2px 6px' }}>{ticket.anonymized_media_ref || 'safe/fixture_anonymized.jpg'}</code>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              🔒 Confidentialité garantie : les visages et plaques d'immatriculation sont protégés avant exposition opérationnelle.
            </div>
          </div>

          {/* Location */}
          <div style={{ background: 'var(--surface-raised)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <MapPin size={16} style={{ color: 'var(--accent)' }} />
              <strong style={{ fontSize: '0.88rem' }}>Localisation &amp; Coordonnées GPS</strong>
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              {ticket.location?.address || 'Repère métropolitain non spécifié'}
            </div>
            {ticket.location?.latitude && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Coordonnées : {ticket.location.latitude}, {ticket.location.longitude}
              </div>
            )}
          </div>
        </div>

        {/* RAG Procedure */}
        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileText size={16} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: '0.9rem' }}>Procédure d'Intervention Standard (Extraits RAG Officiels)</strong>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {ticket.procedure || 'Procédure standard municipale conforme au code de la voirie urbaine.'}
          </p>
        </div>

        {/* Status Transition Control */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Mettre à Jour le Statut d'Intervention</h4>
          <form onSubmit={handleUpdateStatus}>
            <div className="grid-2" style={{ marginBottom: '12px' }}>
              <div>
                <label className="form-label">Nouveau Statut</label>
                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="TICKET_CREATED">TICKET_CREATED (Reçu au guichet)</option>
                  <option value="ASSIGNED">ASSIGNED (Équipe affectée sur le terrain)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Travaux en cours de réalisation)</option>
                  <option value="RESOLVED">RESOLVED (Intervention terminée et validée)</option>
                  <option value="REJECTED">REJECTED (Rejeté / Signalement sans objet)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Identifiant Agent Responsable</label>
                <input
                  type="text"
                  className="form-input"
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  placeholder="ex. agent_voirie_tunis"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Compte-rendu Opérationnel / Notes de Chantier</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Préciser l'équipe dépêchée, le matériel mobilisé ou les motifs de clôture..."
              />
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={isUpdating}>
              <Send size={14} />
              {isUpdating ? 'Enregistrement de la transition...' : 'Appliquer la transition & Historiser en Base'}
            </button>
          </form>
        </div>

        {/* Append-only Event History */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            Journal d'Audit Immuable (Historique SQL <code>ticket_events</code>)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {events.map((ev) => (
              <div
                key={ev.event_id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {ev.from_status ? `${ev.from_status} ➔ ${ev.to_status}` : ev.to_status}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {ev.notes || 'Transition d\'état enregistrée'}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <div>Opérateur : <strong>{ev.actor}</strong></div>
                  <div>{new Date(ev.created_at).toLocaleString('fr-FR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
