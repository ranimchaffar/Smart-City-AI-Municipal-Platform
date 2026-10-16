import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ReportForm } from './components/CitizenPortal/ReportForm';
import { SubmissionResult } from './components/CitizenPortal/SubmissionResult';
import { TicketTracker } from './components/CitizenPortal/TicketTracker';
import { CitizenSpace } from './components/CitizenPortal/CitizenSpace';
import { Sidebar, DashboardSubTab } from './components/MunicipalityDashboard/Sidebar';
import { NeedsAttentionBanner } from './components/MunicipalityDashboard/NeedsAttentionBanner';
import { KpiCards } from './components/MunicipalityDashboard/KpiCards';
import { HighPriorityList } from './components/MunicipalityDashboard/HighPriorityList';
import { LiveMapCard } from './components/MunicipalityDashboard/LiveMapCard';
import { FullMapModal } from './components/MunicipalityDashboard/FullMapModal';
import { RecentReportsTable } from './components/MunicipalityDashboard/RecentReportsTable';
import { TicketDetailDrawer } from './components/MunicipalityDashboard/TicketDetailDrawer';
import { ReviewQueue } from './components/MunicipalityDashboard/ReviewQueue';
import { WorkOrdersView } from './components/MunicipalityDashboard/WorkOrdersView';
import { AnalyticsView } from './components/MunicipalityDashboard/AnalyticsView';
import { TeamView } from './components/MunicipalityDashboard/TeamView';
import { UserManagementView } from './components/MunicipalityDashboard/UserManagementView';
import { AuthModal } from './components/AuthModal';
import { StaffAuthModal } from './components/MunicipalityDashboard/StaffAuthModal';
import {
  fetchDashboardStats,
  fetchTickets,
  fetchHealth,
  fetchCurrentUser,
  logoutUser,
  setAdminN8nMode,
  isStaffAuthenticated,
  DashboardStats,
  TicketDemo,
  MunicipalReportResponse,
  MunicipalReportRequest,
  UserProfile,
} from './services/api';
import { Calendar, Bell, Send, Search, Shield, Lock, Cpu, Database, CheckCircle2, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentTab, setCurrentTab] = useState<'citizen' | 'space' | 'dashboard'>('citizen');
  const [citizenSubTab, setCitizenSubTab] = useState<'report' | 'track'>('report');
  const [dashboardSubTab, setDashboardSubTab] = useState<DashboardSubTab>('overview');

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | 'profile'>('login');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<TicketDemo[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isFullMapModalOpen, setIsFullMapModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<string>('PostgreSQL Actif');
  const [n8nMode, setN8nMode] = useState<string>('mock');

  // Tracking query for deep link into TicketTracker
  const [prefilledTrackReportId, setPrefilledTrackReportId] = useState<string | null>(null);
  const [prefilledTrackToken, setPrefilledTrackToken] = useState<string | null>(null);

  // Citizen submission result state
  const [lastSubmission, setLastSubmission] = useState<{
    response: MunicipalReportResponse;
    request: MunicipalReportRequest;
  } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load user session on mount
  const checkUserSession = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  };

  const loadData = async () => {
    try {
      const [statsData, ticketsData, healthData] = await Promise.all([
        fetchDashboardStats(),
        fetchTickets(),
        fetchHealth(),
      ]);
      setStats(statsData);
      setTickets(ticketsData.tickets || []);
      setSystemStatus(healthData.status === 'healthy' ? 'PostgreSQL Actif' : 'Hors ligne');
      setN8nMode(healthData.n8n_mode || 'mock');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    checkUserSession();
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReportSubmitted = (
    res: MunicipalReportResponse,
    req: MunicipalReportRequest
  ) => {
    setLastSubmission({ response: res, request: req });
    loadData();
  };

  const handleSelectReportToTrack = (reportId: string, token?: string) => {
    setPrefilledTrackReportId(reportId);
    setPrefilledTrackToken(token || null);
    setCurrentTab('citizen');
    setCitizenSubTab('track');
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'MUNICIPAL_AGENT' || user.role === 'ADMINISTRATOR') {
      setCurrentTab('dashboard');
    } else if (user.role === 'CITIZEN') {
      setCurrentTab('space');
    }
    loadData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('citizen');
    loadData();
  };

  const handleToggleN8nMode = async () => {
    try {
      const targetMode = n8nMode === 'live' ? 'mock' : 'live';
      const res = await setAdminN8nMode(targetMode);
      setN8nMode(res.mode);
      loadData();
    } catch (err: any) {
      alert(`Erreur de basculement n8n : ${err.message}`);
    }
  };

  // Check if current user has municipal access
  const isMunicipalStaff =
    currentUser && (currentUser.role === 'MUNICIPAL_AGENT' || currentUser.role === 'ADMINISTRATOR');

  return (
    <div className="app-root">
      {/* Global Top Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(t) => setCurrentTab(t)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        systemStatus={systemStatus}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalMode(currentUser ? 'profile' : 'login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* ==================================================================== */}
      {/* 1. CITIZEN PORTAL (SIGNALEMENT & SUIVI)                               */}
      {/* ==================================================================== */}
      {currentTab === 'citizen' && (
        <main>
          {/* Sub Navigation Bar for Citizen */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border)',
              padding: '8px 48px',
              display: 'flex',
              gap: '12px',
            }}
          >
            <button
              className={`switcher-btn ${citizenSubTab === 'report' ? 'active' : ''}`}
              onClick={() => setCitizenSubTab('report')}
            >
              <Send size={14} />
              Déposer un signalement
            </button>
            <button
              className={`switcher-btn ${citizenSubTab === 'track' ? 'active' : ''}`}
              onClick={() => setCitizenSubTab('track')}
            >
              <Search size={14} />
              Suivre une demande
            </button>
          </div>

          {citizenSubTab === 'report' && (
            <>
              <ReportForm onReportSubmitted={handleReportSubmitted} />

              {lastSubmission && (
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 48px 36px 48px' }}>
                  <SubmissionResult
                    response={lastSubmission.response}
                    request={lastSubmission.request}
                    onReset={() => setLastSubmission(null)}
                  />
                </div>
              )}
            </>
          )}

          {citizenSubTab === 'track' && (
            <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px' }}>
              <TicketTracker />
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* 2. ESPACE CITOYEN AUTHENTIFIÉ (MON ESPACE CITOYEN)                   */}
      {/* ==================================================================== */}
      {currentTab === 'space' && currentUser && (
        <main>
          <CitizenSpace
            currentUser={currentUser}
            onNewReport={() => {
              setCurrentTab('citizen');
              setCitizenSubTab('report');
            }}
            onSelectReportToTrack={handleSelectReportToTrack}
          />
        </main>
      )}

      {/* ==================================================================== */}
      {/* 3. MUNICIPAL OPERATIONS DASHBOARD (CENTRE DES OPÉRATIONS)             */}
      {/* ==================================================================== */}
      {currentTab === 'dashboard' && (
        <>
          {/* Access Control Gate: unauthenticated users cannot access dashboard */}
          {!isMunicipalStaff ? (
            <div
              style={{
                maxWidth: '600px',
                margin: '80px auto',
                textAlign: 'center',
                padding: '48px 32px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px auto',
                }}
              >
                <Shield size={28} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-main)' }}>
                Accès Restreint au Personnel Municipal
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 28px 0', lineHeight: 1.5 }}>
                Le Centre des opérations et la gestion des interventions sont strictement réservés aux agents municipaux et aux administrateurs de la ville.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Lock size={16} />
                Connexion Agent Municipal
              </button>
            </div>
          ) : (
            <div className="dashboard-wrapper">
              {/* Vertical Sidebar with actual authenticated user name & role */}
              <Sidebar
                currentSubTab={dashboardSubTab}
                onSubTabChange={(tab) => setDashboardSubTab(tab)}
                pendingReviewsCount={stats?.pendingReviews || 0}
                onOpenAuthModal={() => {
                  setAuthModalMode('profile');
                  setIsAuthModalOpen(true);
                }}
                currentUser={currentUser}
              />

              {/* Main Dashboard Content Area */}
              <main className="dashboard-content-area">
                {/* Top Header */}
                <div className="dashboard-header-row">
                  <div className="dashboard-title-area">
                    <h1>Centre des opérations</h1>
                    <p>Supervision en temps réel et gestion des interventions municipales.</p>
                  </div>

                  <div className="dashboard-header-controls">
                    <div className="header-date-pill">
                      <Calendar size={15} />
                      <span>Samedi 17 Octobre 2026</span>
                    </div>

                    <div
                      className="notification-bell-btn"
                      onClick={() => setDashboardSubTab('reviews')}
                      title="File de revue humaine (alertes n8n)"
                    >
                      <Bell size={16} />
                      {(stats?.pendingReviews || 0) > 0 && (
                        <div className="notification-counter-badge">
                          {stats?.pendingReviews || 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. Sub-tab: VUE D'ENSEMBLE */}
                {dashboardSubTab === 'overview' && (
                  <>
                    <NeedsAttentionBanner
                      onOpenReviews={() => setDashboardSubTab('reviews')}
                      onFilterOverdue={() => setDashboardSubTab('reports')}
                      onFilterUnassigned={() => setDashboardSubTab('reports')}
                    />

                    <KpiCards stats={stats} />

                    <div className="middle-grid-2">
                      <HighPriorityList
                        tickets={tickets}
                        onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                        onViewAll={() => setDashboardSubTab('reports')}
                      />

                      <LiveMapCard
                        tickets={tickets}
                        onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                        onViewFullMap={() => setIsFullMapModalOpen(true)}
                        selectedTicketId={selectedTicketId}
                      />
                    </div>

                    <RecentReportsTable
                      tickets={tickets}
                      onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                      onRefresh={loadData}
                    />
                  </>
                )}

                {/* 2. Sub-tab: CARTE DES INCIDENTS */}
                {dashboardSubTab === 'map' && (
                  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
                    <LiveMapCard
                      tickets={tickets}
                      onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                      onViewFullMap={() => setIsFullMapModalOpen(true)}
                      selectedTicketId={selectedTicketId}
                    />
                  </div>
                )}

                {/* 3. Sub-tab: SIGNALEMENTS */}
                {dashboardSubTab === 'reports' && (
                  <RecentReportsTable
                    tickets={tickets}
                    onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                    onRefresh={loadData}
                  />
                )}

                {/* 4. Sub-tab: ORDRES DE MISSION */}
                {dashboardSubTab === 'work_orders' && (
                  <WorkOrdersView
                    tickets={tickets}
                    currentUser={currentUser}
                    onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                    onRefresh={loadData}
                  />
                )}

                {/* 5. Sub-tab: ALERTES & REVUE HUMAINE */}
                {dashboardSubTab === 'reviews' && (
                  <ReviewQueue onQueueUpdated={loadData} />
                )}

                {/* 6. Sub-tab: ANALYTIQUE */}
                {dashboardSubTab === 'analytics' && (
                  <AnalyticsView stats={stats} />
                )}

                {/* 7. Sub-tab: ÉQUIPE MUNICIPALE */}
                {dashboardSubTab === 'team' && (
                  <TeamView />
                )}

                {/* 8. Sub-tab: ADMINISTRATION DES UTILISATEURS (Admin only) */}
                {dashboardSubTab === 'members' && (
                  <UserManagementView />
                )}

                {/* 9. Sub-tab: PARAMÈTRES SYSTÈME */}
                {dashboardSubTab === 'settings' && (
                  <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', maxWidth: '800px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)' }}>
                      Paramètres Système & Orchestrateur n8n
                    </h2>

                    {/* Orchestrator Mode Switch */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Cpu size={16} style={{ color: '#2563eb' }} />
                            Mode de l'Orchestrateur n8n
                          </strong>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Actuellement : <strong>{n8nMode === 'live' ? 'Webhook Live Réel' : 'Simulateur Local Conforme (Mock)'}</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleToggleN8nMode}
                        >
                          Basculer vers {n8nMode === 'live' ? 'Simulateur Mock' : 'Webhook Live'}
                        </button>
                      </div>
                    </div>

                    {/* Database Persistence Status */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Database size={16} style={{ color: '#16a34a' }} />
                        État de la Persistance PostgreSQL 14
                      </strong>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Instance locale : <strong>PostgreSQL 14.24 (Ubuntu 22.04 WSL2)</strong><br />
                        Base de données : <code>municipal_tickets</code> • Statut : <span style={{ color: '#16a34a', fontWeight: 700 }}>Connectée</span>
                      </div>
                    </div>

                    {/* Legacy Staff Token */}
                    <StaffAuthModal onAuthChange={loadData} />
                  </div>
                )}
              </main>

              {/* Full Interactive Leaflet Map Modal */}
              <FullMapModal
                isOpen={isFullMapModalOpen}
                onClose={() => setIsFullMapModalOpen(false)}
                tickets={tickets}
                onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                initialSelectedTicketId={selectedTicketId}
              />

              {/* Ticket Details Drawer */}
              {selectedTicketId && (
                <TicketDetailDrawer
                  ticketId={selectedTicketId}
                  onClose={() => setSelectedTicketId(null)}
                  onStatusUpdated={loadData}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Global Authentication Modal (Login, Register, Forgot, Profile) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        initialMode={authModalMode}
      />
    </div>
  );
};
