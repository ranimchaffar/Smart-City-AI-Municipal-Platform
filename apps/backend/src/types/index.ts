export type Decision = 'PASS' | 'REVIEW' | 'REJECT';

export type Category =
  | 'ROAD_DAMAGE'
  | 'STREET_LIGHTING'
  | 'WASTE'
  | 'WATER_LEAK'
  | 'NONE';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH';

export type Department =
  | 'ROADS_DEPARTMENT'
  | 'PUBLIC_LIGHTING_DEPARTMENT'
  | 'SANITATION_DEPARTMENT'
  | 'WATER_SERVICES_DEPARTMENT';

export type TicketStatus =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'ANALYZING'
  | 'REVIEW_REQUIRED'
  | 'TICKET_CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type ReviewStatus = 'PENDING' | 'APPROVED_TO_TICKET' | 'DISMISSED';

export type Location = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
} | null;

export type MediaFixture =
  | 'mock://pothole'
  | 'mock://streetlight'
  | 'mock://waste'
  | 'mock://water_leak'
  | 'mock://unrelated'
  | 'mock://blurry';

export interface MunicipalReportRequest {
  report_id: string;
  description: string;
  media_ref: string;
  location?: Location;
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
  category: Category;
  severity: Severity;
  priority: Priority;
  department: Department;
  location: Location;
  anonymized_media_ref: string | null;
  procedure: string;
  sources: SourceMetadata[];
  deadline: string | null;
  persisted: boolean;
  storage_status: 'MOCK_ONLY' | 'PERSISTED';
  is_mock: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TicketEventRecord {
  event_id?: number;
  ticket_id: string;
  from_status: string | null;
  to_status: string;
  actor: string;
  notes: string | null;
  created_at: string;
}

export interface ReviewCaseRecord {
  review_id: string;
  report_id: string;
  review_reasons: string[];
  status: ReviewStatus;
  raw_payload: any;
  decision_notes: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface ReportRecord {
  report_id: string;
  description: string;
  media_ref: string;
  location: Location;
  decision: Decision;
  status: string;
  demo_mode: boolean;
  created_at: string;
}

export interface AuditStage {
  at: string | null;
  stage: string;
  decision: string;
  reason_codes: string[];
}

export interface MunicipalReportResponse {
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
  audit: {
    report_id: string | null;
    decided_at: string;
    outcome: string;
    stages: AuditStage[];
    agent_versions: Record<string, string>;
    storage: string;
  } | null;
  http_status: number;
}
