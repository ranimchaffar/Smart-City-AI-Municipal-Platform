import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, UserCheck, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ReviewCase, fetchReviewCases, resolveReviewCase } from '../../services/api';

interface ReviewQueueProps {
  onQueueUpdated: () => void;
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

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onQueueUpdated }) => {
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<ReviewCase | null>(null);

  // Form states for approval modal
  const [category, setCategory] = useState('ROAD_DAMAGE');
  const [department, setDepartment] = useState('ROADS_DEPARTMENT');
  const [severity, setSeverity] = useState('MEDIUM');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('agent_moderateur_tunis');
  const [isResolving, setIsResolving] = useState(false);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReviewCases('PENDING');
      setCases(data.reviewCases || []);
    } catch (err) {
      console.error('Error fetching review cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleResolve = async (action: 'APPROVED_TO_TICKET' | 'DISMISSED') => {
    if (!selectedCase) return;

    setIsResolving(true);
    try {
      await resolveReviewCase(
        selectedCase.review_id,
        action,
        reviewerName,
        decisionNotes || (action === 'APPROVED_TO_TICKET' ? 'Approuvé par arbitrage humain du superviseur' : 'Classé sans suite après inspection'),
        action === 'APPROVED_TO_TICKET'
          ? {
              category,
              department,
              severity,
              procedure: `Validation manuelle : Affectation au ${department} après examen du cas de modération par l'agent municipal.`,
            }
          : undefined
      );

      setSelectedCase(null);
      await loadCases();
      onQueueUpdated();
    } catch (err: any) {
      alert(`Erreur lors du traitement du dossier : ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <AlertCircle size={20} style={{ color: 'var(--status-review)' }} />
            File de Modération Humaine (Garde-fous &amp; Escalades AI)
          </h3>
          <p className="form-hint">
            Signalements citoyens orientés vers la vérification humaine par les modules d'ingestion ou de vision avant émission de ticket.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadCases}>
          <RefreshCw size={14} />
          Actualiser la File
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Dossier Modération</th>
              <th>Réf. Signalement</th>
              <th>Motifs d'Alerte / Escalade</th>
              <th>Description Citoyenne</th>
              <th>Date de Transmission</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Aucun dossier en attente de modération humaine. Tous les signalements sont traités automatiquement !
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr key={c.review_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-review)' }}>
                    {c.review_id}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    {c.report_id}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {c.review_reasons.map((r, i) => (
                        <span key={i} className="badge badge-review" style={{ fontSize: '0.7rem' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.82rem', maxWidth: '300px' }}>
                    {c.raw_payload?.description || 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedCase(c);
                        setDecisionNotes(c.decision_notes || '');
                      }}
                    >
                      <UserCheck size={14} />
                      Arbitrer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Triage Modal */}
      {selectedCase && (
        <div className="modal-backdrop" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Arbitrage du Dossier : {selectedCase.review_id}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCase(null)}>
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--surface-raised)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Description Initiale du Citoyen :
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '12px' }}>
                "{selectedCase.raw_payload?.description}"
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Référence Multimédia Associée :
              </div>
              <code className="code-block" style={{ padding: '4px 8px' }}>
                {selectedCase.raw_payload?.media_ref || 'Aucune pièce jointe'}
              </code>
            </div>

            <div className="form-group">
              <label className="form-label">Nom de l'Agent Modérateur</label>
              <input
                type="text"
                className="form-input"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
              />
            </div>

            <div className="grid-3" style={{ marginBottom: '16px' }}>
              <div>
                <label className="form-label">Catégorie Affectée</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value === 'ROAD_DAMAGE') setDepartment('ROADS_DEPARTMENT');
                    if (e.target.value === 'STREET_LIGHTING') setDepartment('PUBLIC_LIGHTING_DEPARTMENT');
                    if (e.target.value === 'WASTE') setDepartment('SANITATION_DEPARTMENT');
                    if (e.target.value === 'WATER_LEAK') setDepartment('WATER_SERVICES_DEPARTMENT');
                  }}
                >
                  <option value="ROAD_DAMAGE">Voirie &amp; Chaussée</option>
                  <option value="STREET_LIGHTING">Éclairage Public</option>
                  <option value="WASTE">Propreté &amp; Déchets</option>
                  <option value="WATER_LEAK">Assainissement &amp; Eau</option>
                </select>
              </div>

              <div>
                <label className="form-label">Direction Municipale</label>
                <select
                  className="form-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="ROADS_DEPARTMENT">Direction de la Voirie</option>
                  <option value="PUBLIC_LIGHTING_DEPARTMENT">Service Éclairage Public</option>
                  <option value="SANITATION_DEPARTMENT">Direction de la Propreté</option>
                  <option value="WATER_SERVICES_DEPARTMENT">Service des Eaux</option>
                </select>
              </div>

              <div>
                <label className="form-label">Niveau d'Urgence</label>
                <select
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="LOW">Faible (LOW)</option>
                  <option value="MEDIUM">Moyen (MEDIUM)</option>
                  <option value="HIGH">Élevé (HIGH)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Motifs de Décision &amp; Consignes Opérationnelles</label>
              <textarea
                className="form-textarea"
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Indiquer les motifs de confirmation ou de rejet pour traçabilité..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleResolve('DISMISSED')}
                disabled={isResolving}
              >
                <XCircle size={14} />
                Classer Sans Suite (Rejet)
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleResolve('APPROVED_TO_TICKET')}
                disabled={isResolving}
              >
                <CheckCircle size={14} />
                Valider &amp; Émettre le Ticket Officiel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
