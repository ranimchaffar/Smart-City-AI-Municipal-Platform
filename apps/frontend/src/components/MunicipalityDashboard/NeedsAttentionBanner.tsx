import React from 'react';
import { Megaphone, AlertTriangle, UserPlus, Clock } from 'lucide-react';

interface NeedsAttentionBannerProps {
  onOpenReviews: () => void;
  onFilterOverdue?: () => void;
  onFilterUnassigned?: () => void;
}

export const NeedsAttentionBanner: React.FC<NeedsAttentionBannerProps> = ({
  onOpenReviews,
  onFilterOverdue,
  onFilterUnassigned,
}) => {
  return (
    <div className="needs-attention-banner">
      <div className="attention-banner-top">
        <div className="attention-badge-icon">
          <Megaphone size={16} />
        </div>
        <span className="attention-title">Nécessite une intervention</span>
        <span className="attention-action-pill">Action requise</span>
        <span className="attention-subtitle">Dossiers prioritaires nécessitant un traitement</span>
      </div>

      <div className="attention-cards-grid">
        {/* Card 1: Overdue / Open High Priority */}
        <div className="attention-card">
          <div>
            <div className="attention-card-header">
              <AlertTriangle size={18} className="attention-card-header-icon" />
              <div className="attention-card-title">Incidents Prioritaires Ouverts</div>
            </div>
            <div className="attention-card-desc">
              Tickets nécessitant une intervention d'urgence sur le terrain.
            </div>
          </div>
          <button
            type="button"
            className="attention-btn-secondary"
            onClick={onFilterOverdue}
          >
            Consulter
          </button>
        </div>

        {/* Card 2: Unassigned */}
        <div className="attention-card">
          <div>
            <div className="attention-card-header">
              <UserPlus size={18} style={{ color: '#ea580c', marginTop: '1px' }} />
              <div>
                <div className="attention-card-title">Tickets Sans Agent Assigné</div>
                <div className="attention-card-meta">
                  <span>● AFFECTATION EN ATTENTE</span>
                </div>
              </div>
            </div>
            <div className="attention-card-desc">
              Attribuer une brigade municipale pour lancer les travaux.
            </div>
          </div>
          <button
            type="button"
            className="attention-btn-primary"
            onClick={onFilterUnassigned}
          >
            Affecter
          </button>
        </div>

        {/* Card 3: Human Review Queue */}
        <div className="attention-card">
          <div>
            <div className="attention-card-header">
              <Clock size={18} style={{ color: '#ea580c', marginTop: '1px' }} />
              <div>
                <div className="attention-card-title">File de Revue Humaine</div>
                <div className="attention-card-meta">
                  <span>● ARBITRAGE AGENT REQUIS</span>
                </div>
              </div>
            </div>
            <div className="attention-card-desc">
              Cas ambigus ou discordants nécessitant une validation municipale.
            </div>
          </div>
          <button
            type="button"
            className="attention-btn-primary"
            onClick={onOpenReviews}
          >
            Examiner
          </button>
        </div>
      </div>
    </div>
  );
};
