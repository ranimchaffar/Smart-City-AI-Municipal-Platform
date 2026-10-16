import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ReportForm } from './components/CitizenPortal/ReportForm';
import { SubmissionResult } from './components/CitizenPortal/SubmissionResult';
import { TicketTracker } from './components/CitizenPortal/TicketTracker';
import { KpiCards } from './components/MunicipalityDashboard/KpiCards';
import { TicketTable } from './components/MunicipalityDashboard/TicketTable';
import { TicketDetailDrawer } from './components/MunicipalityDashboard/TicketDetailDrawer';
import { ReviewQueue } from './components/MunicipalityDashboard/ReviewQueue';
import { TransparencyMap } from './components/MunicipalityDashboard/TransparencyMap';
import { StaffAuthModal } from './components/MunicipalityDashboard/StaffAuthModal';
import {
  fetchDashboardStats,
  fetchTickets,
  fetchHealth,
  DashboardStats,
  TicketDemo,
  MunicipalReportResponse,
  MunicipalReportRequest,
} from './services/api';
import { Send, Search, ListFilter, AlertCircle, Map, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentTab, setCurrentTab] = useState<'citizen' | 'dashboard'>('citizen');
  const [citizenSubTab, setCitizenSubTab] = useState<'report' | 'track'>('report');
  const [dashboardSubTab, setDashboardSubTab] = useState<'tickets' | 'reviews' | 'map'>('tickets');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<TicketDemo[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<string>('En Ligne');

  // Citizen submission state
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
      setSystemStatus(`${healthData.status === 'healthy' ? 'PostgreSQL Actif' : 'Hors Ligne'}`);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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

  return (
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        onTabChange={(t) => setCurrentTab(t)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        systemStatus={systemStatus}
      />

      <main className="main-content">
        {/* ============================================================== */}
        {/* CITIZEN PORTAL (GUICHET CITOYEN)                              */}
        {/* ============================================================== */}
        {currentTab === 'citizen' && (
          <div>
            {/* Sub-navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                className={`btn ${citizenSubTab === 'report' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setCitizenSubTab('report')}
              >
                <Send size={14} />
                Déclarer une Anomalie Urbaine
              </button>
              <button
                className={`btn ${citizenSubTab === 'track' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setCitizenSubTab('track')}
              >
                <Search size={14} />
                Suivre un Signalement
              </button>
            </div>

            {citizenSubTab === 'report' && (
              <>
                <ReportForm onReportSubmitted={handleReportSubmitted} />

                {lastSubmission && (
                  <SubmissionResult
                    response={lastSubmission.response}
                    request={lastSubmission.request}
                    onReset={() => setLastSubmission(null)}
                  />
                )}
              </>
            )}

            {citizenSubTab === 'track' && <TicketTracker />}
          </div>
        )}

        {/* ============================================================== */}
        {/* MUNICIPALITY OPERATIONS DASHBOARD (COCKPIT MÉTROPOLITAIN)     */}
        {/* ============================================================== */}
        {currentTab === 'dashboard' && (
          <div>
            <StaffAuthModal onAuthChange={loadData} />
            <KpiCards stats={stats} />

            {/* Dashboard Sub-tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                className={`btn ${dashboardSubTab === 'tickets' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setDashboardSubTab('tickets')}
              >
                <ListFilter size={14} />
                Gestion des Tickets ({tickets.length})
              </button>
              <button
                className={`btn ${dashboardSubTab === 'reviews' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setDashboardSubTab('reviews')}
              >
                <AlertCircle size={14} />
                File de Modération Humaine ({stats?.pendingReviews || 0})
              </button>
              <button
                className={`btn ${dashboardSubTab === 'map' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setDashboardSubTab('map')}
              >
                <Map size={14} />
                Cartographie d'Intervention
              </button>
            </div>

            {dashboardSubTab === 'tickets' && (
              <TicketTable
                tickets={tickets}
                onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                onRefresh={loadData}
              />
            )}

            {dashboardSubTab === 'reviews' && <ReviewQueue onQueueUpdated={loadData} />}

            {dashboardSubTab === 'map' && <TransparencyMap tickets={tickets} />}

            {selectedTicketId && (
              <TicketDetailDrawer
                ticketId={selectedTicketId}
                onClose={() => setSelectedTicketId(null)}
                onStatusUpdated={loadData}
              />
            )}
          </div>
        )}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
        }}
      >
        Plateforme Métropolitaine de Gestion Urbaine Intelligente • Esprit 5DS - Projet Deep Learning Avancé • Rôle Membre 5 : Portail Citoyen, Cockpit Métropolitain &amp; Base PostgreSQL Sécurisée
      </footer>
    </div>
  );
};
