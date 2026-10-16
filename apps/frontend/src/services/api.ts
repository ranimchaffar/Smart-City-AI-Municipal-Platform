export interface MunicipalReportRequest {
  report_id: string;
  description: string;
  category_hint?: string;
  media_ref: string;
  location?: {
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

export interface SourceMetadata {
  document_title: string;
  source_url: string | null;
  chunk_id: string;
  search_score: number | null;
  is_official: boolean;
  is_mock: boolean;
}

export interface TicketDemo {
  ticket_id: string;
  report_id: string;
  status: string;
  category: string;
  severity: string;
  priority: string;
  department: string;
  assigned_to?: string | null;
  assigned_agent_name?: string | null;
  location: {
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  anonymized_media_ref: string | null;
  procedure: string;
  sources: SourceMetadata[];
  deadline: string | null;
  persisted: boolean;
  storage_status: string;
  is_mock: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TicketEvent {
  event_id: number;
  ticket_id: string;
  from_status: string | null;
  to_status: string;
  actor: string;
  notes: string | null;
  created_at: string;
}

export interface ReviewCase {
  review_id: string;
  report_id: string;
  review_reasons: string[];
  status: 'PENDING' | 'APPROVED_TO_TICKET' | 'DISMISSED';
  raw_payload: any;
  decision_notes: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface MunicipalReportResponse {
  report_id: string | null;
  decision: 'PASS' | 'REVIEW' | 'REJECT';
  ticket: TicketDemo | null;
  review_reasons: string[];
  errors: string[];
  demo_mode: boolean;
  agents_are_mock: boolean;
  orchestrator_mode?: string;
  tracking_token?: string;
  notice: string;
  versions: Record<string, string>;
  trace: Array<{
    at: string | null;
    stage: string;
    decision: string;
    reason_codes: string[];
  }>;
  audit: any;
  http_status: number;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  assignedTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  highPriorityTickets?: number;
  unassignedTickets?: number;
  overdueTickets?: number;
  geocodedTickets?: number;
  pendingReviews: number;
  byCategory: Record<string, number>;
  byDepartment: Record<string, number>;
  bySeverity: Record<string, number>;
  resolvedRate: number;
  avgResponseTime?: number | null;
  avgResolutionTime?: number | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'MUNICIPAL_AGENT' | 'ADMINISTRATOR';
  department: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuditLogRecord {
  log_id: number;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

export interface CitizenReportItem {
  report_id: string;
  description: string;
  media_ref: string;
  location: {
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  decision: string;
  status: string;
  demo_mode: boolean;
  user_id?: string | null;
  tracking_token?: string | null;
  created_at: string;
}

const API_BASE = '/api';

/**
 * Backward compatibility token storage for staff bearer fallback.
 */
let memoryStaffToken: string | null = null;
try {
  memoryStaffToken = sessionStorage.getItem('municipal_staff_token');
} catch (e) {}

export function setStaffToken(token: string | null) {
  memoryStaffToken = token ? token.trim() : null;
  try {
    if (memoryStaffToken) {
      sessionStorage.setItem('municipal_staff_token', memoryStaffToken);
    } else {
      sessionStorage.removeItem('municipal_staff_token');
    }
  } catch (e) {}
}

export function getStaffToken(): string | null {
  if (!memoryStaffToken) {
    try {
      memoryStaffToken = sessionStorage.getItem('municipal_staff_token');
    } catch (e) {}
  }
  return memoryStaffToken;
}

export function isStaffAuthenticated(): boolean {
  return !!getStaffToken();
}

export function getStaffAuthHeader(): Record<string, string> {
  const token = getStaffToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT API
// ============================================================================

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, user: data.user };
    }
    return { success: false, error: data.message || 'Identifiants invalides' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau lors de la connexion' };
  }
}

export async function registerCitizen(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, phone: phone?.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, user: data.user };
    }
    return { success: false, error: data.message || 'Erreur lors de l’inscription' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur réseau' };
  }
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
      headers: {
        ...getStaffAuthHeader(),
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function updateProfile(name?: string, phone?: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, user: data.user };
    }
    return { success: false, error: data.message || 'Mise à jour impossible' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string; reset_token?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    return {
      success: res.ok,
      message: data.message || 'Instructions envoyées.',
      reset_token: data.reset_token,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), new_password: newPassword }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message || 'Réinitialisation échouée.' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {}
  setStaffToken(null);
}

// Backward compatibility helper
export async function loginStaff(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: token.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setStaffToken(token.trim());
      return { success: true };
    }
    return { success: false, error: data.message || 'Authentification échouée' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur de connexion' };
  }
}

export function logoutStaff() {
  logoutUser();
}

// ============================================================================
// CITIZEN INCIDENT & TRACKING API
// ============================================================================

export async function submitMunicipalReport(
  payload: MunicipalReportRequest
): Promise<MunicipalReportResponse> {
  const response = await fetch(`${API_BASE}/municipal-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getStaffAuthHeader() },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as MunicipalReportResponse;
  return data;
}

export async function fetchUserReports(): Promise<{ total: number; reports: CitizenReportItem[] }> {
  const res = await fetch(`${API_BASE}/municipal-ticket/citizen/my-reports`, {
    credentials: 'include',
    headers: { ...getStaffAuthHeader() },
  });
  if (!res.ok) throw new Error('Impossible de charger vos signalements');
  return res.json();
}

export async function fetchReportWithTracking(report_id: string, token?: string) {
  const query = token ? `?token=${encodeURIComponent(token.trim())}` : '';
  const res = await fetch(`${API_BASE}/municipal-ticket/${report_id}${query}`, {
    credentials: 'include',
    headers: { ...getStaffAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Signalement introuvable ou accès non autorisé');
  }
  return res.json();
}

export async function fetchReportDetails(report_id: string) {
  return fetchReportWithTracking(report_id);
}

// ============================================================================
// MUNICIPAL TICKETS & REVIEWS API
// ============================================================================

export async function fetchTickets(params?: {
  category?: string;
  department?: string;
  status?: string;
  severity?: string;
  priority?: string;
  search?: string;
}): Promise<{ total: number; tickets: TicketDemo[] }> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.append(k, v);
    });
  }
  const res = await fetch(`${API_BASE}/tickets?${searchParams.toString()}`, {
    credentials: 'include',
    headers: { ...getStaffAuthHeader() },
  });
  return res.json();
}

export async function fetchTicketById(
  id: string
): Promise<{ ticket: TicketDemo; events: TicketEvent[] }> {
  const res = await fetch(`${API_BASE}/tickets/${id}`, {
    credentials: 'include',
    headers: { ...getStaffAuthHeader() },
  });
  if (!res.ok) throw new Error('Ticket introuvable');
  return res.json();
}

export async function updateTicketStatus(
  ticket_id: string,
  status: string,
  actor: string,
  notes?: string
): Promise<{ message: string; ticket: TicketDemo; events: TicketEvent[] }> {
  const res = await fetch(`${API_BASE}/tickets/${ticket_id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getStaffAuthHeader(),
    },
    credentials: 'include',
    body: JSON.stringify({ status, actor, notes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Échec de mise à jour du statut');
  }
  return res.json();
}

export async function fetchReviewCases(
  status?: string
): Promise<{ total: number; reviewCases: ReviewCase[] }> {
  const query = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/reviews${query}`, {
    credentials: 'include',
    headers: {
      ...getStaffAuthHeader(),
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Échec de récupération des cas en revue');
  }
  return res.json();
}

export async function resolveReviewCase(
  review_id: string,
  status: 'APPROVED_TO_TICKET' | 'DISMISSED',
  resolved_by: string,
  decision_notes?: string,
  approvedTicketData?: any
) {
  const res = await fetch(`${API_BASE}/reviews/${review_id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getStaffAuthHeader(),
    },
    credentials: 'include',
    body: JSON.stringify({ status, resolved_by, decision_notes, approvedTicketData }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Échec de résolution du cas');
  }
  return res.json();
}

export async function uploadMediaFile(file: File): Promise<{
  media_ref: string;
  filename: string;
  size_bytes: number;
}> {
  const formData = new FormData();
  formData.append('media', file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Échec du téléversement du média');
  }

  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`, {
    credentials: 'include',
  });
  return res.json();
}

export async function fetchHealth(): Promise<{
  status: string;
  database: { connected: boolean; engine: string };
  n8n_mode: string;
}> {
  const res = await fetch(`${API_BASE}/health`, {
    credentials: 'include',
  });
  return res.json();
}

// ============================================================================
// ADMINISTRATOR API
// ============================================================================

export async function fetchAdminUsers(role?: string, department?: string): Promise<{ total: number; users: UserProfile[] }> {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (department) params.append('department', department);

  const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
    credentials: 'include',
    headers: { ...getStaffAuthHeader() },
  });
  if (!res.ok) throw new Error('Accès réservé aux administrateurs');
  return res.json();
}

export async function createAdminUser(userData: {
  name: string;
  email: string;
  password?: string;
  role: string;
  department?: string | null;
  phone?: string | null;
}): Promise<{ message: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getStaffAuthHeader() },
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Échec de création du compte utilisateur');
  }
  return res.json();
}

export async function updateAdminUser(
  userId: string,
  updates: {
    role?: string;
    department?: string | null;
    is_active?: boolean;
    name?: string;
    phone?: string | null;
  }
): Promise<{ message: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getStaffAuthHeader() },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Échec de mise à jour de l’utilisateur');
  }
  return res.json();
}

export async function assignTicket(
  ticketId: string,
  assignedTo: string,
  assignedAgentName: string
): Promise<{ message: string; ticket: TicketDemo }> {
  const res = await fetch(`${API_BASE}/admin/tickets/${ticketId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getStaffAuthHeader() },
    credentials: 'include',
    body: JSON.stringify({ assigned_to: assignedTo, assigned_agent_name: assignedAgentName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Échec de l’assignation du ticket');
  }
  return res.json();
}

export async function fetchAuditLogs(): Promise<{ total: number; logs: AuditLogRecord[] }> {
  const res = await fetch(`${API_BASE}/admin/audit-logs`, {
    credentials: 'include',
    headers: { ...getStaffAuthHeader() },
  });
  if (!res.ok) throw new Error('Accès réservé aux administrateurs');
  return res.json();
}

export async function setAdminN8nMode(mode: 'live' | 'mock'): Promise<{ message: string; mode: string }> {
  const res = await fetch(`${API_BASE}/admin/set-n8n-mode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getStaffAuthHeader(),
    },
    credentials: 'include',
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to set orchestrator mode');
  }
  return res.json();
}
