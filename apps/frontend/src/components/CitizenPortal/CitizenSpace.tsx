import React, { useState, useEffect } from 'react';
import {
  fetchUserReports,
  fetchReportWithTracking,
  CitizenReportItem,
  UserProfile,
} from '../../services/api';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface CitizenSpaceProps {
  currentUser: UserProfile;
  onNewReport: () => void;
  onSelectReportToTrack: (reportId: string, token?: string) => void;
}

export const CitizenSpace: React.FC<CitizenSpaceProps> = ({
  currentUser,
  onNewReport,
  onSelectReportToTrack,
}) => {
  const [reports, setReports] = useState<CitizenReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tracking by token state
  const [trackReportId, setTrackReportId] = useState('');
  const [trackToken, setTrackToken] = useState('');
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserReports();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer vos signalements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackReportId.trim()) {
      setTrackingError('Veuillez renseigner un identifiant de signalement (ex. RPT-...)');
      return;
    }
    setTrackingError(null);
    onSelectReportToTrack(trackReportId.trim(), trackToken.trim() || undefined);
  };

  const getStatusBadge = (status: string, decision: string) => {
    if (decision === 'REJECT') {
      return (
        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={12} /> Rejeté
        </span>
      );
    }
    switch (status) {
      case 'RESOLVED':
        return (
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} /> Résolu
          </span>
        );
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return (
          <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> En cours de traitement
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Revue municipale en cours
          </span>
        );
      default:
        return (
          <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Enregistré
          </span>
        );
    }
  };

  const totalReports = reports.length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;
  const inProgressCount = reports.filter((r) => ['IN_PROGRESS', 'ASSIGNED', 'REVIEW_REQUIRED', 'TICKET_CREATED'].includes(r.status)).length;

  return (
    <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 24px' }}>
      {/* Citizen Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: '#ffffff',
          marginBottom: '28px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Shield size={24} style={{ color: '#93c5fd' }} />
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#bfdbfe' }}>
              Espace Citoyen Authentifié
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0' }}>
            Bienvenue, {currentUser.name}
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', maxWidth: '600px' }}>
            Consultez le suivi en temps réel de tous vos signalements municipaux et interagissez directement avec les services de la ville.
          </p>
        </div>

        <button
          onClick={onNewReport}
          className="btn btn-primary"
          style={{
            background: '#ffffff',
            color: '#1e3a8a',
            fontWeight: 700,
            border: 'none',
            padding: '12px 20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}
        >
          <PlusCircle size={18} />
          Nouveau signalement
        </button>
      </div>

      {/* Citizen KPI Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Total de vos signalements
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalReports}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            En cours d'intervention
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb' }}>
            {inProgressCount}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
            Interventions résolues
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Track anonymous ticket search bar */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} /> Suivre un signalement avec un jeton ou identifiant
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
          Si vous avez effectué un signalement anonyme ou sans connexion, entrez le numéro et le jeton de suivi reçu :
        </p>
        <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="N° Signalement (ex. RPT-1234)"
            value={trackReportId}
            onChange={(e) => setTrackReportId(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '13px',
              background: '#ffffff',
            }}
          />
          <input
            type="text"
            placeholder="Jeton secret de suivi (optionnel pour vos signalements)"
            value={trackToken}
            onChange={(e) => setTrackToken(e.target.value)}
            style={{
              flex: '1 1 280px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '13px',
              fontFamily: 'monospace',
              background: '#ffffff',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
          >
            Vérifier le statut
          </button>
        </form>
        {trackingError && (
          <div style={{ marginTop: '10px', color: '#b91c1c', fontSize: '12px' }}>
            {trackingError}
          </div>
        )}
      </div>

      {/* Reports Table Section */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Historique de vos signalements
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Liste des demandes rattachées à votre compte citoyen
            </p>
          </div>
          <button
            onClick={loadReports}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0 }}>Chargement de vos signalements...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#b91c1c' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 8px auto' }} />
            <p>{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <FileText size={42} style={{ color: '#cbd5e1', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Aucun signalement pour le moment
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
              Vous n'avez pas encore soumis de signalement depuis ce compte. Participez à l'amélioration de votre ville dès aujourd'hui !
            </p>
            <button
              onClick={onNewReport}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}
            >
              Créer mon premier signalement
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Identifiant</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Description</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Localisation</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)' }}>Statut</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr
                    key={r.report_id}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => onSelectReportToTrack(r.report_id, r.tracking_token || undefined)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--primary)' }}>
                      {r.report_id}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.description}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        {r.location?.address || 'Tunis'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {getStatusBadge(r.status, r.decision)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReportToTrack(r.report_id, r.tracking_token || undefined);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                      >
                        Suivre <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
