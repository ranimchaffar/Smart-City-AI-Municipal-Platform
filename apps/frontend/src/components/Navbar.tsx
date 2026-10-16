import React from 'react';
import { Sun, Moon, Activity, LayoutDashboard, Send, ShieldCheck } from 'lucide-react';

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
  systemStatus = 'PostgreSQL Active',
}) => {
  return (
    <header className="global-top-bar">
      <div
        className="global-brand"
        onClick={() => onTabChange('citizen')}
        title="Citizen Request - Municipal Portal"
      >
        <div className="brand-icon-circle">
          CR
        </div>
        <div className="brand-title">
          Citizen Request
          {currentTab === 'citizen' && <div className="brand-title-underline" />}
        </div>
      </div>

      <div className="top-nav-switcher">
        <button
          id="nav-tab-citizen"
          className={`switcher-btn ${currentTab === 'citizen' ? 'active' : ''}`}
          onClick={() => onTabChange('citizen')}
        >
          <Send size={14} />
          Citizen Portal
        </button>
        <button
          id="nav-tab-dashboard"
          className={`switcher-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <LayoutDashboard size={14} />
          Operations Center
        </button>
      </div>

      <div className="top-bar-right">
        <div className="system-status-pill" title="Live PostgreSQL 14 persistence active">
          <div className="system-status-dot" />
          <span>{systemStatus}</span>
        </div>

        <button
          id="theme-toggle-btn"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
};
