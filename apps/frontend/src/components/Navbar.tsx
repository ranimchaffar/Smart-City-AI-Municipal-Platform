import React from 'react';
import { Building2, Sun, Moon, ShieldCheck, Activity, Users, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  currentTab: 'citizen' | 'dashboard';
  onTabChange: (tab: 'citizen' | 'dashboard') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  systemStatus?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  theme,
  onToggleTheme,
  systemStatus = 'PostgreSQL Connecté',
}) => {
  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand-section">
            <div className="brand-logo" title="République & Métropole - Système Civique Automatisé">
              <Building2 size={24} />
            </div>
            <div>
              <div className="brand-title">Portail Métropolitain des Incidents Urbains</div>
              <div className="brand-subtitle">Smart City IA • Supervision &amp; Persistance PostgreSQL (Membre 5)</div>
            </div>
          </div>

          <div className="nav-tabs">
            <button
              id="nav-tab-citizen"
              className={`nav-tab-btn ${currentTab === 'citizen' ? 'active' : ''}`}
              onClick={() => onTabChange('citizen')}
              aria-label="Accéder au guichet citoyen"
            >
              <Users size={16} />
              Guichet Citoyen
            </button>
            <button
              id="nav-tab-dashboard"
              className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => onTabChange('dashboard')}
              aria-label="Accéder au cockpit des opérations"
            >
              <LayoutDashboard size={16} />
              Cockpit des Opérations
            </button>
          </div>

          <div className="nav-actions">
            <div className="disclaimer-badge" title="Persistance PostgreSQL active & passerelle d'orchestration n8n opérationnelle">
              <Activity size={13} className="pulse-glow" />
              <span>{systemStatus}</span>
            </div>

            <button
              id="theme-toggle-btn"
              className="btn btn-secondary btn-sm"
              onClick={onToggleTheme}
              aria-label="Basculer le thème"
              title={`Activer le mode ${theme === 'dark' ? 'clair' : 'sombre'}`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      <div className="disclaimer-banner">
        <ShieldCheck size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span>
          <strong>Transparence &amp; Déontologie :</strong> Traitement d'orchestration par agents déterministes n8n. Persistance relationnelle intègre sous PostgreSQL 14. Anonymisation RGPD des photographies et protection stricte des données personnelles.
        </span>
      </div>
    </>
  );
};
