export interface MunicipalReportRequest {
  report_id: string;
  description: string;
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
  pendingReviews: number;
  byCategory: Record<string, number>;
  byDepartment: Record<string, number>;
  bySeverity: Record<string, number>;
  resolvedRate: number;
}

const API_BASE = '/api';

/**
 * Dynamic session-backed staff authorization management.
 * Credentials are NEVER hardcoded in client code or bundle.
 */
let memoryStaffToken: string | null = null;

try {
  memoryStaffToken = sessionStorage.getItem('municipal_staff_token');
} catch (e) {
  // session storage unavailable
}

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

export async function loginStaff(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  setStaffToken(null);
}

export async function submitMunicipalReport(
  payload: MunicipalReportRequest
): Promise<MunicipalReportResponse> {
  const response = await fetch(`${API_BASE}/municipal-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as MunicipalReportResponse;
  return data;
}

export async function fetchReportDetails(report_id: string) {
  const res = await fetch(`${API_BASE}/municipal-ticket/${report_id}`);
  if (!res.ok) throw new Error('Report not found');
  return res.json();
}

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
  const res = await fetch(`${API_BASE}/tickets?${searchParams.toString()}`);
  return res.json();
}

export async function fetchTicketById(
  id: string
): Promise<{ ticket: TicketDemo; events: TicketEvent[] }> {
  const res = await fetch(`${API_BASE}/tickets/${id}`);
  if (!res.ok) throw new Error('Ticket not found');
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
    body: JSON.stringify({ status, actor, notes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update status');
  }
  return res.json();
}

export async function fetchReviewCases(
  status?: string
): Promise<{ total: number; reviewCases: ReviewCase[] }> {
  const query = status ? `?status=${status}` : '';
  const res = await fetch(`${API_BASE}/reviews${query}`, {
    headers: {
      ...getStaffAuthHeader(),
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to fetch review cases');
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
    body: JSON.stringify({ status, resolved_by, decision_notes, approvedTicketData }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to resolve review case');
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
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'File upload failed');
  }

  return res.json();
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function fetchHealth(): Promise<{
  status: string;
  database: { connected: boolean; engine: string };
  n8n_mode: string;
}> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function setAdminN8nMode(mode: 'live' | 'mock'): Promise<{ message: string; mode: string }> {
  const res = await fetch(`${API_BASE}/admin/set-n8n-mode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getStaffAuthHeader(),
    },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to set orchestrator mode');
  }
  return res.json();
}
