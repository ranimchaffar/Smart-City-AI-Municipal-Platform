import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building,
  Clock,
  Shield,
  FileText,
  MapPin,
  Layers,
  Database,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { MunicipalReportResponse, MunicipalReportRequest } from '../../services/api';

interface SubmissionResultProps {
  response: MunicipalReportResponse;
  request: MunicipalReportRequest;
  onReset: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  INPUT_CHECK: '1. Contrôle du Format & Sécurité',
  GATE_1_INTAKE: '2. Normalisation Intake & Données Personnelles',
  GATE_2_VISION: '3. Analyse Visuelle & Cohérence Image/Texte',
  GATE_3_KNOWLEDGE: '4. Procédures Réglementaires & RAG',
  PERSISTED: '5. Enregistrement PostgreSQL',
};

const DEPARTMENT_LABELS: Record<string, string> = {
  ROADS_DEPARTMENT: 'Direction de la Voirie et des Espaces Publics',
  PUBLIC_LIGHTING_DEPARTMENT: 'Direction de l\'Éclairage Public et des Réseaux',
  SANITATION_DEPARTMENT: 'Direction de la Propreté et de l\'Hygiène Urbaine',
  WATER_SERVICES_DEPARTMENT: 'Direction de l\'Assainissement et des Eaux',
};

export const SubmissionResult: React.FC<SubmissionResultProps> = ({
  response,
  request,
  onReset,
}) => {
  const { decision, ticket, review_reasons, errors, trace, http_status } = response;

  return (
    <div
      className="card"
      style={{
        marginTop: '24px',
        borderLeft: `6px solid ${
          decision === 'PASS'
            ? 'var(--status-pass)'
            : decision === 'REVIEW'
            ? 'var(--status-review)'
            : 'var(--status-reject)'
        }`,
      }}
    >
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {decision === 'PASS' && <CheckCircle2 size={36} style={{ color: 'var(--status-pass)' }} />}
          {decision === 'REVIEW' && <AlertCircle size={36} style={{ color: 'var(--status-review)' }} />}
          {decision === 'REJECT' && <XCircle size={36} style={{ color: 'var(--status-reject)' }} />}

          <div>
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              {decision === 'PASS' && 'Signalement Validé — Ticket Officiel Émis'}
              {decision === 'REVIEW' && 'Dossier Transféré en File de Modération Humaine'}
              {decision === 'REJECT' && 'Signalement Rejeté par la Politique de Saisie'}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Statut Décisionnel :{' '}
              <strong
                style={{
                  color:
                    decision === 'PASS'
                      ? 'var(--status-pass)'
                      : decision === 'REVIEW'
                      ? 'var(--status-review)'
                      : 'var(--status-reject)',
                }}
              >
                {decision === 'PASS' ? 'VALIDÉ (PASS)' : decision === 'REVIEW' ? 'MODÉRATION (REVIEW)' : 'REJETÉ (REJECT)'}
              </strong>{' '}
              • Code HTTP {http_status} • Clé d'Idempotence : <code>{response.report_id}</code>
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onReset}>
          Nouveau Signalement
        </button>
      </div>

      {/* ----------------- RÉSULTAT : PASS (SUCCÈS & CRÉATION) ----------------- */}
      {decision === 'PASS' && ticket && (
        <div>
          {/* Bannière de Persistance PostgreSQL */}
          <div
            style={{
              background: ticket.persisted ? 'var(--status-pass-subtle)' : 'var(--status-review-subtle)',
              border: `1px solid ${ticket.persisted ? 'rgba(5, 150, 105, 0.35)' : 'rgba(217, 119, 6, 0.35)'}`,
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Database size={20} style={{ color: ticket.persisted ? 'var(--status-pass)' : 'var(--status-review)' }} />
              <div>
                <strong style={{ color: ticket.persisted ? 'var(--status-pass)' : 'var(--status-review)' }}>
                  {ticket.persisted ? 'Persistance Réelle PostgreSQL 14 Validée' : 'Mode Simulation Démonstrateur'}
                </strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {ticket.persisted
                    ? 'Le signalement est gravé durablement dans la base de données relationnelle municipale (Table tickets).'
                    : 'Simulation de test n8n active.'}
                </div>
              </div>
            </div>

            <span className={`badge ${ticket.persisted ? 'badge-pass' : 'badge-review'}`}>
              {ticket.persisted ? 'POSTGRESQL GARANTI' : 'MODE TEST'}
            </span>
          </div>

          {/* Jeton Secret de Suivi Anonyme (Requirement 1 & 2) */}
          {response.tracking_token && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                <Shield size={16} /> Jeton Secret de Suivi Citoyen (Accès Anonyme Sécurisé)
              </div>
              <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>
                Conservez précieusement ce jeton pour suivre l'évolution de votre signalement anonyme à tout moment :
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <code style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a' }}>
                  {response.tracking_token}
                </code>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigator.clipboard.writeText(response.tracking_token!)}
                  style={{ fontSize: '11px' }}
                >
                  Copier le jeton
                </button>
              </div>
            </div>
          )}

          {/* Attributs Clés du Ticket */}
          <div className="grid-4" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div>
                <div className="stat-label">Numéro de Ticket Officiel</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                  {ticket.ticket_id}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-label">Typologie Validée</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>
                  {ticket.category.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-label">Niveau de Gravité</div>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge ${ticket.severity === 'HIGH' ? 'badge-reject' : ticket.severity === 'MEDIUM' ? 'badge-review' : 'badge-pass'}`}>
                    {ticket.severity === 'HIGH' ? 'URGENCE ÉLEVÉE' : ticket.severity === 'MEDIUM' ? 'GRAVITÉ MOYENNE' : 'PRIORITÉ STANDARD'}
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div>
                <div className="stat-label">Statut du Dossier</div>
                <div style={{ marginTop: '4px' }}>
                  <span className="badge badge-info">
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Direction Affectée & Procédure d'Intervention RAG */}
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Building size={16} style={{ color: 'var(--primary)' }} />
              <strong>Direction Municipale en Charge :</strong>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {DEPARTMENT_LABELS[ticket.department] || ticket.department}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
              <strong>Procédure d'Intervention Référencée (Base Documentaire) :</strong>
              <p style={{ margin: '4px 0 0' }}>{ticket.procedure}</p>
            </div>

            {ticket.sources && ticket.sources.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Sources Documentaires &amp; RAG Associées :
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ticket.sources.map((src, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{src.document_title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ fontSize: '0.74rem', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {src.chunk_id}
                        </code>
                        <span className={`badge ${src.is_mock ? 'badge-review' : 'badge-pass'}`} style={{ fontSize: '0.68rem' }}>
                          {src.is_mock ? 'SOURCE SIMULÉE' : 'DOCUMENT OFFICIEL'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- RÉSULTAT : REVIEW (MODÉRATION HUMAINE) ----------------- */}
      {decision === 'REVIEW' && (
        <div>
          <div
            style={{
              background: 'var(--status-review-subtle)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ color: 'var(--status-review)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              Vérification Manuelle Requise par les Services Municipaux
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Les filtres automatisés d'ingestion et de vision ont détecté une incertitude, une ambiguïté ou une incohérence entre la photographie et le texte de description.
              Votre signalement a été immédiatement orienté vers la <strong>File de Triage des Agents Municipaux (Réf : REV-{response.report_id})</strong> pour instruction humaine prioritaire.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Motifs d'Orientation vers la Modération Humaine :
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {review_reasons.map((reason, i) => (
                <span key={i} className="badge badge-review" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  ⚠️ {reason}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- RÉSULTAT : REJECT (REJET DE SAISIE) ----------------- */}
      {decision === 'REJECT' && (
        <div>
          <div
            style={{
              background: 'var(--status-reject-subtle)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ color: 'var(--status-reject)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={18} />
              Signalement Non Conforme aux Règles de Saisie
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Le contrôle d'entrée a rejeté le signalement car un ou plusieurs champs obligatoires sont manquants, invalides ou ne respectent pas les critères d'admissibilité (absence de photographie, texte trop court ou format de données erroné).
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Anomalies Détectées :
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {errors.map((err, i) => (
                <span key={i} className="badge badge-reject" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  ❌ {err}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TRACE DU PIPELINE DÉCISIONNEL n8n ----------------- */}
      {trace && trace.length > 0 && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: '0.92rem' }}>Audit du Pipeline Décisionnel n8n (5 Étapes de Contrôle) :</strong>
          </div>

          <div className="workflow-pipeline">
            {trace.map((step, idx) => (
              <div
                key={idx}
                className={`pipeline-node ${
                  step.decision === 'PASS'
                    ? 'pass'
                    : step.decision === 'REVIEW'
                    ? 'review'
                    : 'reject'
                }`}
              >
                <div className="pipeline-stage-name">
                  {STAGE_LABELS[step.stage] || step.stage}
                </div>
                <div
                  className="pipeline-decision"
                  style={{
                    color:
                      step.decision === 'PASS'
                        ? 'var(--status-pass)'
                        : step.decision === 'REVIEW'
                        ? 'var(--status-review)'
                        : 'var(--status-reject)',
                  }}
                >
                  {step.decision === 'PASS' ? '✅ VALIDÉ' : step.decision === 'REVIEW' ? '⚠️ MODÉRATION' : '❌ REJET'}
                </div>
                {step.reason_codes && step.reason_codes.length > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {step.reason_codes.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
