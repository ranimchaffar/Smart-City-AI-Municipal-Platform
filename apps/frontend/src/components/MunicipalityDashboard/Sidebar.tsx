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
  Shield,
  Settings,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../../services/api';

export type DashboardSubTab =
  | 'overview'
  | 'map'
  | 'reports'
  | 'work_orders'
  | 'reviews'
  | 'analytics'
  | 'team'
  | 'members'
  | 'settings';

interface SidebarProps {
  currentSubTab: DashboardSubTab;
  onSubTabChange: (tab: DashboardSubTab) => void;
  pendingReviewsCount: number;
  onOpenAuthModal: () => void;
  currentUser: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSubTab,
  onSubTabChange,
  pendingReviewsCount,
  onOpenAuthModal,
  currentUser,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'Administrateur';
      case 'MUNICIPAL_AGENT':
        return 'Agent Municipal';
      case 'CITIZEN':
        return 'Citoyen';
      default:
        return 'Non connecté';
    }
  };

  const isAdmin = currentUser?.role === 'ADMINISTRATOR';

  return (
    <aside className="dashboard-sidebar">
      <div>
        {/* Brand Block */}
        <div className="sidebar-brand-block">
          <div className="sidebar-logo-pin">
            <MapPin size={18} strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-text">
            <h2>Ville Intelligente</h2>
            <span>Centre des opérations</span>
          </div>
        </div>

        {/* WORKSPACE Section */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">Espace Opérationnel</div>
          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'overview' ? 'active' : ''}`}
            onClick={() => onSubTabChange('overview')}
          >
            <LayoutGrid size={16} />
            <span>Vue d'ensemble</span>
          </button>
        </div>

        {/* OPERATIONS Section */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">Opérations de Terrain</div>
          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'map' ? 'active' : ''}`}
            onClick={() => onSubTabChange('map')}
          >
            <Map size={16} />
            <span>Carte des incidents</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'reports' ? 'active' : ''}`}
            onClick={() => onSubTabChange('reports')}
          >
            <FileText size={16} />
            <span>Signalements</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'work_orders' ? 'active' : ''}`}
            onClick={() => onSubTabChange('work_orders')}
          >
            <Wrench size={16} />
            <span>Ordres de mission</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'reviews' ? 'active' : ''}`}
            onClick={() => onSubTabChange('reviews')}
          >
            <Bell size={16} />
            <span>Alertes & Revue</span>
            {pendingReviewsCount > 0 && (
              <span className="sidebar-item-badge">{pendingReviewsCount}</span>
            )}
          </button>
        </div>

        {/* MANAGEMENT Section */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">Pilotage & Équipes</div>
          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onSubTabChange('analytics')}
          >
            <BarChart2 size={16} />
            <span>Analytique</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'team' ? 'active' : ''}`}
            onClick={() => onSubTabChange('team')}
          >
            <Users size={16} />
            <span>Équipe municipale</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`sidebar-item ${currentSubTab === 'members' ? 'active' : ''}`}
              onClick={() => onSubTabChange('members')}
            >
              <Shield size={16} />
              <span>Administration</span>
            </button>
          )}

          <button
            type="button"
            className={`sidebar-item ${currentSubTab === 'settings' ? 'active' : ''}`}
            onClick={() => onSubTabChange('settings')}
          >
            <Settings size={16} />
            <span>Paramètres système</span>
          </button>
        </div>
      </div>

      {/* User Card */}
      <div
        className="sidebar-user-card"
        onClick={onOpenAuthModal}
        title="Gérer votre profil et authentification"
      >
        <div
          className="user-avatar-circle"
          style={{ background: currentUser ? (currentUser.role === 'ADMINISTRATOR' ? '#b91c1c' : '#2563eb') : '#64748b' }}
        >
          {getInitials(currentUser?.name)}
        </div>
        <div className="user-info-text">
          <div className="user-name">
            {currentUser?.name || 'Connexion requise'}
          </div>
          <div className="user-role">
            {getRoleLabel(currentUser?.role)}
          </div>
        </div>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
    </aside>
  );
};
