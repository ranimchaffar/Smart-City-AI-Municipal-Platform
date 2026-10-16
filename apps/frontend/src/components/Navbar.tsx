import React from 'react';
import { Sun, Moon, Activity, LayoutDashboard, Send, ShieldCheck, User, LogIn } from 'lucide-react';
import { UserProfile } from '../services/api';

interface NavbarProps {
  currentTab: 'citizen' | 'dashboard' | 'space';
  onTabChange: (tab: 'citizen' | 'dashboard' | 'space') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  systemStatus?: string;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  theme,
  onToggleTheme,
  systemStatus = 'PostgreSQL Actif',
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="global-top-bar">
      <div
        className="global-brand"
        onClick={() => onTabChange('citizen')}
        title="Portail Citoyen — Ville Intelligente"
        style={{ cursor: 'pointer' }}
      >
        <div className="brand-icon-circle">
          VI
        </div>
        <div className="brand-title">
          Ville Intelligente
          <div className="brand-title-underline" />
        </div>
      </div>

      <div className="top-nav-switcher">
        <button
          id="nav-tab-citizen"
          className={`switcher-btn ${currentTab === 'citizen' ? 'active' : ''}`}
          onClick={() => onTabChange('citizen')}
        >
          <Send size={14} />
          Signalement Citoyen
        </button>

        {currentUser?.role === 'CITIZEN' && (
          <button
            id="nav-tab-space"
            className={`switcher-btn ${currentTab === 'space' ? 'active' : ''}`}
            onClick={() => onTabChange('space')}
          >
            <User size={14} />
            Mon Espace Citoyen
          </button>
        )}

        <button
          id="nav-tab-dashboard"
          className={`switcher-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <LayoutDashboard size={14} />
          Centre des opérations
        </button>
      </div>

      <div className="top-bar-right">
        <div className="system-status-pill" title="Persistance PostgreSQL 14 active">
          <div className="system-status-dot" />
          <span>{systemStatus}</span>
        </div>

        {/* Auth Button */}
        {currentUser ? (
          <button
            onClick={onOpenAuth}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px' }}
            title="Mon profil & Déconnexion"
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: currentUser.role === 'ADMINISTRATOR' ? '#b91c1c' : '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              {currentUser.name.slice(0, 1).toUpperCase()}
            </div>
            <span>{currentUser.name.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px' }}
          >
            <LogIn size={13} />
            Connexion
          </button>
        )}

        <button
          id="theme-toggle-btn"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label="Basculer le thème"
          title={`Activer le mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
};
