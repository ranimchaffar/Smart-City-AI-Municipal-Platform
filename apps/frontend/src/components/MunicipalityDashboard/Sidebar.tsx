import React from 'react';
import {
  MapPin,
  LayoutGrid,
  Map,
  FileText,
  Wrench,
  Bell,
  BarChart2,
  Users,
  UserPlus,
  Settings,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  currentSubTab: 'overview' | 'map' | 'reports' | 'reviews' | 'settings';
  onSubTabChange: (tab: 'overview' | 'map' | 'reports' | 'reviews' | 'settings') => void;
  pendingReviewsCount: number;
  onOpenAuthModal: () => void;
  isAuthenticated: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSubTab,
  onSubTabChange,
  pendingReviewsCount,
  onOpenAuthModal,
  isAuthenticated,
}) => {
  return (
    <aside className="dashboard-sidebar">
      <div>
        {/* Brand Block matching Reference Image 1 */}
        <div className="sidebar-brand-block">
          <div className="sidebar-logo-pin">
            <MapPin size={18} strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-text">
            <h2>Fixly</h2>
            <span>City Dashboard</span>
          </div>
        </div>

        {/* WORKSPACE Section */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">Workspace</div>
          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'overview' ? 'active' : ''}`}
            onClick={() => onSubTabChange('overview')}
          >
            <LayoutGrid size={16} />
            <span>Overview</span>
          </button>
        </div>

        {/* OPERATIONS Section */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">Operations</div>
          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'map' ? 'active' : ''}`}
            onClick={() => onSubTabChange('map')}
          >
            <Map size={16} />
            <span>Map</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'reports' ? 'active' : ''}`}
            onClick={() => onSubTabChange('reports')}
          >
            <FileText size={16} />
            <span>Reports</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'reports' ? 'active' : ''}`}
            onClick={() => onSubTabChange('reports')}
          >
            <Wrench size={16} />
            <span>Work Orders</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'reviews' ? 'active' : ''}`}
            onClick={() => onSubTabChange('reviews')}
          >
            <Bell size={16} />
            <span>Alerts</span>
            {pendingReviewsCount > 0 && (
              <span className="sidebar-item-badge">{pendingReviewsCount}</span>
            )}
          </button>
        </div>

        {/* MANAGEMENT Section */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">Management</div>
          <button
            type="button"
            className="sidebar-item"
            onClick={() => onSubTabChange('overview')}
          >
            <BarChart2 size={16} />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={() => onSubTabChange('overview')}
          >
            <Users size={16} />
            <span>Team</span>
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={() => onSubTabChange('overview')}
          >
            <UserPlus size={16} />
            <span>Members</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              onSubTabChange('settings');
              onOpenAuthModal();
            }}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* User Card matching Reference Image 1 */}
      <div
        className="sidebar-user-card"
        onClick={onOpenAuthModal}
        title="Click to manage municipal agent authentication"
      >
        <div
          className="user-avatar-circle"
          style={{ background: isAuthenticated ? '#2563eb' : '#64748b' }}
        >
          SK
        </div>
        <div className="user-info-text">
          <div className="user-name">Sarah Khan</div>
          <div className="user-role">
            {isAuthenticated ? 'Administrator (Auth)' : 'Guest / Staff Login'}
          </div>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
    </aside>
  );
};
