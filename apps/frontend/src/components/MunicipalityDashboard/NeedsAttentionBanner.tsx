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
        <span className="attention-title">Needs Attention</span>
        <span className="attention-action-pill">Action Required</span>
        <span className="attention-subtitle">3 items need action right now</span>
      </div>

      <div className="attention-cards-grid">
        {/* Card 1: Overdue */}
        <div className="attention-card">
          <div>
            <div className="attention-card-header">
              <AlertTriangle size={18} className="attention-card-header-icon" />
              <div className="attention-card-title">2 overdue — all within SLA</div>
            </div>
            <div className="attention-card-desc">
              Every active report still has time on the clock.
            </div>
          </div>
          <button
            type="button"
            className="attention-btn-secondary"
            onClick={onFilterOverdue}
          >
            Resolve now
          </button>
        </div>

        {/* Card 2: Unassigned */}
        <div className="attention-card">
          <div>
            <div className="attention-card-header">
              <UserPlus size={18} style={{ color: '#ea580c', marginTop: '1px' }} />
              <div>
                <div className="attention-card-title">3 unassigned high-priority</div>
                <div className="attention-card-meta">
                  <span>● NEEDS AN OWNER</span>
                </div>
              </div>
            </div>
            <div className="attention-card-desc">
              Assign a team to start the clock.
            </div>
          </div>
          <button
            type="button"
            className="attention-btn-primary"
            onClick={onFilterUnassigned}
          >
            Assign now
          </button>
        </div>

        {/* Card 3: Nearing SLA Breach */}
        <div className="attention-card">
          <div>
            <div className="attention-card-header">
              <Clock size={18} style={{ color: '#ea580c', marginTop: '1px' }} />
              <div>
                <div className="attention-card-title">1 nearing SLA breach</div>
                <div className="attention-card-meta">
                  <span>● TIGHTEST: 2H REMAINING</span>
                </div>
              </div>
            </div>
            <div className="attention-card-desc">
              Less than 25% of SLA window remaining.
            </div>
          </div>
          <button
            type="button"
            className="attention-btn-primary"
            onClick={onOpenReviews}
          >
            Review now
          </button>
        </div>
      </div>
    </div>
  );
};
