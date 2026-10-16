import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ReportForm } from './components/CitizenPortal/ReportForm';
import { SubmissionResult } from './components/CitizenPortal/SubmissionResult';
import { TicketTracker } from './components/CitizenPortal/TicketTracker';
import { Sidebar } from './components/MunicipalityDashboard/Sidebar';
import { NeedsAttentionBanner } from './components/MunicipalityDashboard/NeedsAttentionBanner';
import { KpiCards } from './components/MunicipalityDashboard/KpiCards';
import { HighPriorityList } from './components/MunicipalityDashboard/HighPriorityList';
import { LiveMapCard } from './components/MunicipalityDashboard/LiveMapCard';
import { RecentReportsTable } from './components/MunicipalityDashboard/RecentReportsTable';
import { TicketDetailDrawer } from './components/MunicipalityDashboard/TicketDetailDrawer';
import { ReviewQueue } from './components/MunicipalityDashboard/ReviewQueue';
import { StaffAuthModal } from './components/MunicipalityDashboard/StaffAuthModal';
import {
  fetchDashboardStats,
  fetchTickets,
  fetchHealth,
  isStaffAuthenticated,
  DashboardStats,
  TicketDemo,
  MunicipalReportResponse,
  MunicipalReportRequest,
} from './services/api';
import { Calendar, Bell, Send, Search } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentTab, setCurrentTab] = useState<'citizen' | 'dashboard'>('dashboard'); // Start on Operations Center or Citizen as needed
  const [citizenSubTab, setCitizenSubTab] = useState<'report' | 'track'>('report');
  const [dashboardSubTab, setDashboardSubTab] = useState<
    'overview' | 'map' | 'reports' | 'reviews' | 'settings'
  >('overview');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<TicketDemo[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<string>('PostgreSQL Active');

  // Citizen submission result state
  const [lastSubmission, setLastSubmission] = useState<{
    response: MunicipalReportResponse;
    request: MunicipalReportRequest;
  } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const loadData = async () => {
    try {
      const [statsData, ticketsData, healthData] = await Promise.all([
        fetchDashboardStats(),
        fetchTickets(),
        fetchHealth(),
      ]);
      setStats(statsData);
      setTickets(ticketsData.tickets || []);
      setSystemStatus(healthData.status === 'healthy' ? 'PostgreSQL Active' : 'Offline');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
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

  const authenticated = isStaffAuthenticated();

  return (
    <div className="app-root">
      {/* Global Top Bar matching Reference Image 2 header styling */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(t) => setCurrentTab(t)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        systemStatus={systemStatus}
      />

      {/* ==================================================================== */}
      {/* 1. CITIZEN PORTAL (REFERENCE IMAGE 2: CITIZEN REQUEST)               */}
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
              Submit Incident
            </button>
            <button
              className={`switcher-btn ${citizenSubTab === 'track' ? 'active' : ''}`}
              onClick={() => setCitizenSubTab('track')}
            >
              <Search size={14} />
              Track a Request
            </button>
          </div>

          {citizenSubTab === 'report' && (
            <>
              {/* Form matching Reference Image 2 */}
              <ReportForm onReportSubmitted={handleReportSubmitted} />

              {/* Submission Result / Confirmation if submitted */}
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
      {/* 2. MUNICIPAL OPERATIONS DASHBOARD (REFERENCE IMAGE 1: FIXLY)         */}
      {/* ==================================================================== */}
      {currentTab === 'dashboard' && (
        <div className="dashboard-wrapper">
          {/* Vertical Sidebar matching Reference Image 1 */}
          <Sidebar
            currentSubTab={dashboardSubTab}
            onSubTabChange={(tab) => setDashboardSubTab(tab)}
            pendingReviewsCount={stats?.pendingReviews || 0}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            isAuthenticated={authenticated}
          />

          {/* Main Dashboard Area */}
          <main className="dashboard-content-area">
            {/* Top Dashboard Header matching Reference Image 1 */}
            <div className="dashboard-header-row">
              <div className="dashboard-title-area">
                <h1>Operations Center</h1>
                <p>Here's what's happening in your city today.</p>
              </div>

              <div className="dashboard-header-controls">
                <div className="header-date-pill">
                  <Calendar size={15} />
                  <span>Saturday, April 25</span>
                </div>

                <div
                  className="notification-bell-btn"
                  onClick={() => setDashboardSubTab('reviews')}
                  title="View alerts / human review queue"
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

            {/* Sub-tab Views */}
            {dashboardSubTab === 'overview' && (
              <>
                {/* Needs Attention Banner matching Reference Image 1 */}
                <NeedsAttentionBanner
                  onOpenReviews={() => setDashboardSubTab('reviews')}
                  onFilterOverdue={() => setDashboardSubTab('reports')}
                  onFilterUnassigned={() => setDashboardSubTab('reports')}
                />

                {/* 5 KPI Cards Grid matching Reference Image 1 */}
                <KpiCards stats={stats} />

                {/* Middle Grid: High Priority Issues + Live Map */}
                <div className="middle-grid-2">
                  <HighPriorityList
                    tickets={tickets}
                    onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                    onViewAll={() => setDashboardSubTab('reports')}
                  />

                  <LiveMapCard
                    tickets={tickets}
                    onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                    onViewFullMap={() => setDashboardSubTab('map')}
                  />
                </div>

                {/* Bottom Section: Recent Reports Table */}
                <RecentReportsTable
                  tickets={tickets}
                  onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                  onRefresh={loadData}
                />
              </>
            )}

            {/* Dedicated Reviews Queue Sub-tab (Alerts) */}
            {dashboardSubTab === 'reviews' && (
              <ReviewQueue onQueueUpdated={loadData} />
            )}

            {/* Dedicated Reports Sub-tab */}
            {dashboardSubTab === 'reports' && (
              <RecentReportsTable
                tickets={tickets}
                onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                onRefresh={loadData}
              />
            )}

            {/* Dedicated Full Map Sub-tab */}
            {dashboardSubTab === 'map' && (
              <LiveMapCard
                tickets={tickets}
                onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
              />
            )}

            {/* Dedicated Settings Sub-tab */}
            {dashboardSubTab === 'settings' && (
              <div style={{ maxWidth: '700px' }}>
                <StaffAuthModal onAuthChange={loadData} />
              </div>
            )}
          </main>

          {/* Modal / Drawer for Ticket Details (RAG SLA, Status Lifecycle) */}
          {selectedTicketId && (
            <TicketDetailDrawer
              ticketId={selectedTicketId}
              onClose={() => setSelectedTicketId(null)}
              onStatusUpdated={loadData}
            />
          )}

          {/* Modal for Staff Authentication */}
          {isAuthModalOpen && (
            <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Staff Authentication</h3>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsAuthModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <StaffAuthModal
                  onAuthChange={() => {
                    loadData();
                    setIsAuthModalOpen(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
