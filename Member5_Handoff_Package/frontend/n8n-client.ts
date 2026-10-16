/**
 * Municipal Ticket Phase 5 demo — Member 5 frontend helper.
 * Only call this from your UI through your own /api/municipal-ticket backend proxy.
 * This is a SIMULATED workflow: no photo upload, real inference, or ticket persistence.
 */
export type Decision = 'PASS' | 'REVIEW' | 'REJECT';
export type Category = 'ROAD_DAMAGE' | 'STREET_LIGHTING' | 'WASTE' | 'WATER_LEAK' | 'NONE';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH';
export type Department = 'ROADS_DEPARTMENT' | 'PUBLIC_LIGHTING_DEPARTMENT' | 'SANITATION_DEPARTMENT' | 'WATER_SERVICES_DEPARTMENT';
export type Location = { address?: string | null; latitude?: number | null; longitude?: number | null } | null;
export type MediaFixture = 'mock://pothole' | 'mock://streetlight' | 'mock://waste' | 'mock://water_leak' | 'mock://unrelated' | 'mock://blurry';
export type MunicipalReportRequest = {
  report_id: string;
  description: string;
  media_ref: MediaFixture | string;
  location?: Location;
};
export type SourceMetadata = {
  document_title: string;
  source_url: string | null;
  chunk_id: string;
  search_score: number | null;
  is_official: boolean;
  is_mock: boolean;
};
export type TicketDemo = {
  ticket_id: string;
  report_id: string;
  status: string;
  category: Category;
  severity: Severity;
  priority: Priority;
  department: Department;
  location: Location;
  anonymized_media_ref: string | null;
  procedure: string;
  sources: SourceMetadata[];
  deadline: string | null;
  persisted: false; // CURRENT demo only. New API will eventually return true after DB commit.
  storage_status: 'MOCK_ONLY';
  is_mock: true;
};
export type AuditStage = { at: string | null; stage: string; decision: string; reason_codes: string[] };
export type MunicipalReportResponse = {
  report_id: string | null;
  decision: Decision;
  ticket: TicketDemo | null;
  review_reasons: string[];
  errors: string[];
  demo_mode: boolean;
  agents_are_mock: boolean;
  notice: string;
  versions: Record<string, string>;
  trace: AuditStage[];
  audit: {report_id: string | null; decided_at: string; outcome: string; stages: AuditStage[]; agent_versions: Record<string,string>; storage: string} | null;
  http_status: number;
};

export async function submitMunicipalReport(
  report: MunicipalReportRequest,
  endpoint = '/api/municipal-ticket',
): Promise<MunicipalReportResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
  // HTTP 202 REVIEW and 422 REJECT are expected business responses, not transport exceptions.
  // Fetch resolves for non-2xx HTTP statuses. Parse JSON first.
  const body = await response.json() as MunicipalReportResponse;
  if (!body || !['PASS', 'REVIEW', 'REJECT'].includes(body.decision)) {
    throw new Error('Unexpected response from municipal workflow');
  }
  if (body.decision === 'PASS' && body.ticket?.persisted === false) {
    // Display: "Demo ticket — not saved"; never show real tracking confirmation.
  }
  return body;
}
