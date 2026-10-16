import {
  MunicipalReportRequest,
  MunicipalReportResponse,
  AuditStage,
  TicketDemo,
  Category,
  Department,
  Severity,
  Priority,
  SourceMetadata,
} from '../types/index.js';

/**
 * High-fidelity Phase 5 n8n Workflow Simulation Engine.
 * Matches the exact 20-node topology and policy gate logic from:
 * Member5_Handoff_Package/n8n/municipal-ticket-phase5.json
 */
export function runPhase5Workflow(report: MunicipalReportRequest): MunicipalReportResponse {
  const startedAt = new Date().toISOString();
  const trace: AuditStage[] = [];
  const errors: string[] = [];
  const review_reasons: string[] = [];

  const rawReportId = typeof report.report_id === 'string' ? report.report_id.trim() : '';
  const rawDesc = typeof report.description === 'string' ? report.description.trim() : '';
  const rawMedia = typeof report.media_ref === 'string' ? report.media_ref.trim() : '';

  // -------------------------------------------------------------
  // NODE 2: Input Check
  // -------------------------------------------------------------
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(rawReportId)) {
    errors.push('INVALID_REPORT_ID');
  }
  if (rawDesc.length < 5 || rawDesc.length > 3000) {
    errors.push('INVALID_DESCRIPTION');
  }
  if (!rawMedia) {
    errors.push('MISSING_MEDIA_REF');
  } else if (
    rawMedia.length > 512 ||
    rawMedia.includes('..') ||
    !/^(mock:\/\/[a-z0-9_-]+|uploads\/[A-Za-z0-9_./-]+)$/.test(rawMedia)
  ) {
    errors.push('UNSAFE_MEDIA_REF');
  }

  let validatedLocation = null;
  if (report.location !== undefined && report.location !== null) {
    const loc = report.location;
    if (typeof loc !== 'object' || Array.isArray(loc)) {
      errors.push('INVALID_LOCATION');
    } else {
      const lat = loc.latitude === undefined || loc.latitude === null ? null : loc.latitude;
      const lon = loc.longitude === undefined || loc.longitude === null ? null : loc.longitude;
      const address = typeof loc.address === 'string' ? loc.address.trim() : null;

      if (
        (lat !== null && (typeof lat !== 'number' || !Number.isFinite(lat) || Math.abs(lat) > 90)) ||
        (lon !== null && (typeof lon !== 'number' || !Number.isFinite(lon) || Math.abs(lon) > 180)) ||
        (address !== null && address.length > 300)
      ) {
        errors.push('INVALID_LOCATION');
      } else {
        validatedLocation = { latitude: lat, longitude: lon, address: address || null };
      }
    }
  }

  const inputDecision = errors.length > 0 ? 'REJECT' : 'PASS';
  trace.push({
    at: new Date().toISOString(),
    stage: 'INPUT_CHECK',
    decision: inputDecision,
    reason_codes: [...errors],
  });

  // If Input Check failed, terminate immediately with REJECT (HTTP 422)
  if (inputDecision === 'REJECT') {
    return {
      report_id: rawReportId || null,
      decision: 'REJECT',
      ticket: null,
      review_reasons: [],
      errors,
      demo_mode: true,
      agents_are_mock: true,
      notice:
        'Demo only: Intake/Vision/Knowledge results are fixture-based; no actual image inference, verified municipal procedure or saved ticket.',
      versions: { orchestrator: 'member1-v4' },
      trace,
      audit: {
        report_id: rawReportId || null,
        decided_at: new Date().toISOString(),
        outcome: 'REJECT',
        stages: trace,
        agent_versions: { orchestrator: 'member1-v4' },
        storage: 'NONE',
      },
      http_status: 422,
    };
  }

  // -------------------------------------------------------------
  // NODE 4 & 5: HTTP Intake & Gate 1 - Intake
  // -------------------------------------------------------------
  let gate1Decision = 'PASS';
  const gate1Problems: string[] = [];

  const isMockFixture = rawMedia.startsWith('mock://');
  const isRealUpload = rawMedia.startsWith('uploads/');

  if (isMockFixture) {
    // Valid mock fixture accepted in demo mode
  } else if (isRealUpload) {
    // Real uploads with stub intake do not yet have genuine face blurring / verification
    gate1Problems.push('INTAKE_MEDIA_OR_PRIVACY_NOT_VERIFIED');
    gate1Decision = 'REVIEW';
  } else {
    gate1Problems.push('INTAKE_ENDPOINT_FAILED_OR_INVALID');
    gate1Decision = 'REVIEW';
  }

  trace.push({
    at: new Date().toISOString(),
    stage: 'GATE_1_INTAKE',
    decision: gate1Decision,
    reason_codes: [...gate1Problems],
  });

  if (gate1Decision === 'REVIEW') {
    review_reasons.push(...gate1Problems);
    return buildFinalResponse(rawReportId, 'REVIEW', null, review_reasons, [], trace, 202);
  }

  // -------------------------------------------------------------
  // NODE 6 & 7: HTTP Vision & Gate 2 - Vision
  // -------------------------------------------------------------
  let gate2Decision = 'PASS';
  const gate2Problems: string[] = [];

  let detectedCategory: Category = 'NONE';
  let detectedSeverity: Severity = 'LOW';
  let evidence: string[] = [];
  let isConsistent = true;
  let isUncertain = false;

  const descLower = rawDesc.toLowerCase();

  switch (rawMedia) {
    case 'mock://pothole':
      detectedCategory = 'ROAD_DAMAGE';
      detectedSeverity = 'HIGH';
      evidence = ['Hole visible in the road surface', 'Cracked asphalt rim'];
      // Check mismatch fixture: if citizen describes a streetlight but sends pothole photo
      if (descLower.includes('light') || descLower.includes('lamp') || descLower.includes('dark')) {
        isConsistent = false;
      }
      break;

    case 'mock://streetlight':
      detectedCategory = 'STREET_LIGHTING';
      detectedSeverity = 'MEDIUM';
      evidence = ['Broken streetlight fixture on pole', 'Unlit street segment'];
      if (descLower.includes('pothole') || descLower.includes('hole') || descLower.includes('asphalt')) {
        isConsistent = false;
      }
      break;

    case 'mock://waste':
      detectedCategory = 'WASTE';
      detectedSeverity = 'MEDIUM';
      evidence = ['Overflowing garbage bin and scattered rubbish'];
      if (descLower.includes('leak') || descLower.includes('water') || descLower.includes('pipe')) {
        isConsistent = false;
      }
      break;

    case 'mock://water_leak':
      detectedCategory = 'WATER_LEAK';
      detectedSeverity = 'HIGH';
      evidence = ['Pressurized water stream gushing from pavement'];
      if (descLower.includes('garbage') || descLower.includes('waste') || descLower.includes('trash')) {
        isConsistent = false;
      }
      break;

    case 'mock://unrelated':
      detectedCategory = 'NONE';
      detectedSeverity = 'LOW';
      evidence = [];
      isConsistent = false;
      isUncertain = true;
      break;

    case 'mock://blurry':
      detectedCategory = 'ROAD_DAMAGE';
      detectedSeverity = 'MEDIUM';
      evidence = ['Image blurry; cannot confirm pavement state'];
      isUncertain = true;
      break;

    default:
      detectedCategory = 'NONE';
      isUncertain = true;
      break;
  }

  const validCategories = ['ROAD_DAMAGE', 'STREET_LIGHTING', 'WASTE', 'WATER_LEAK'];
  if (!validCategories.includes(detectedCategory)) {
    gate2Problems.push('UNKNOWN_CATEGORY');
  }
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(detectedSeverity)) {
    gate2Problems.push('UNKNOWN_SEVERITY');
  }
  if (!isConsistent) {
    gate2Problems.push('IMAGE_TEXT_MISMATCH_OR_UNCLEAR');
  }
  if (isUncertain) {
    gate2Problems.push('VISION_UNCERTAIN');
  }
  if (evidence.length === 0) {
    gate2Problems.push('VISION_MISSING_EVIDENCE');
  }

  gate2Decision = gate2Problems.length > 0 ? 'REVIEW' : 'PASS';
  trace.push({
    at: new Date().toISOString(),
    stage: 'GATE_2_VISION',
    decision: gate2Decision,
    reason_codes: [...gate2Problems],
  });

  if (gate2Decision === 'REVIEW') {
    review_reasons.push(...gate2Problems);
    return buildFinalResponse(rawReportId, 'REVIEW', null, review_reasons, [], trace, 202);
  }

  // -------------------------------------------------------------
  // NODE 8: Department Rules (Deterministic mapping)
  // -------------------------------------------------------------
  const departmentMap: Record<string, Department> = {
    ROAD_DAMAGE: 'ROADS_DEPARTMENT',
    STREET_LIGHTING: 'PUBLIC_LIGHTING_DEPARTMENT',
    WASTE: 'SANITATION_DEPARTMENT',
    WATER_LEAK: 'WATER_SERVICES_DEPARTMENT',
  };

  const assignedDept = departmentMap[detectedCategory];
  if (!assignedDept) {
    review_reasons.push('NO_DEPARTMENT_RULE');
    trace.push({
      at: new Date().toISOString(),
      stage: 'DEPARTMENT_ROUTING',
      decision: 'REVIEW',
      reason_codes: ['NO_DEPARTMENT_RULE'],
    });
    return buildFinalResponse(rawReportId, 'REVIEW', null, review_reasons, [], trace, 202);
  }

  trace.push({
    at: new Date().toISOString(),
    stage: 'DEPARTMENT_ROUTING',
    decision: 'PASS',
    reason_codes: [],
  });

  // -------------------------------------------------------------
  // NODE 9 & 10: HTTP Knowledge & Gate 3 - Sources
  // -------------------------------------------------------------
  let gate3Decision = 'PASS';
  const gate3Problems: string[] = [];

  // Special negative test fixtures for Knowledge Agent:
  // e.g. knowledge_outage.json, knowledge_empty_sources.json, knowledge_wrong_id.json
  if (
    rawReportId === 'RPT-KNOW-FAIL' ||
    descLower.includes('knowledge outage') ||
    descLower.includes('agent outage')
  ) {
    gate3Problems.push('KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID');
  } else if (
    rawReportId === 'RPT-KNOW-EMPTY' ||
    descLower.includes('empty sources') ||
    descLower.includes('no source')
  ) {
    gate3Problems.push('MISSING_SOURCE');
  } else if (
    rawReportId === 'RPT-KNOW-WRONG' ||
    descLower.includes('wrong report id')
  ) {
    gate3Problems.push('KNOWLEDGE_REPORT_ID_MISMATCH');
  }

  let procedure = '';
  let sources: SourceMetadata[] = [];

  switch (detectedCategory) {
    case 'ROAD_DAMAGE':
      procedure =
        'DEMO ONLY: send the report to ROADS_DEPARTMENT for human assessment. This is not an official municipal procedure.';
      sources = [
        {
          document_title: 'DEMO PLACEHOLDER - NOT MUNICIPAL POLICY',
          source_url: null,
          chunk_id: 'mock-road_damage-01',
          search_score: null,
          is_official: false,
          is_mock: true,
        },
      ];
      break;

    case 'STREET_LIGHTING':
      procedure =
        'DEMO ONLY: dispatch inspection team to inspect luminaire and electrical feed. This is not an official municipal procedure.';
      sources = [
        {
          document_title: 'DEMO PLACEHOLDER - NOT MUNICIPAL POLICY',
          source_url: null,
          chunk_id: 'mock-street_lighting-01',
          search_score: null,
          is_official: false,
          is_mock: true,
        },
      ];
      break;

    case 'WASTE':
      procedure =
        'DEMO ONLY: schedule municipal collection vehicle for bin emptying. This is not an official municipal procedure.';
      sources = [
        {
          document_title: 'DEMO PLACEHOLDER - NOT MUNICIPAL POLICY',
          source_url: null,
          chunk_id: 'mock-waste-01',
          search_score: null,
          is_official: false,
          is_mock: true,
        },
      ];
      break;

    case 'WATER_LEAK':
      procedure =
        'DEMO ONLY: notify water dispatch for line shut-off and trenching. This is not an official municipal procedure.';
      sources = [
        {
          document_title: 'DEMO PLACEHOLDER - NOT MUNICIPAL POLICY',
          source_url: null,
          chunk_id: 'mock-water_leak-01',
          search_score: null,
          is_official: false,
          is_mock: true,
        },
      ];
      break;
  }

  if (gate3Problems.length > 0) {
    gate3Decision = 'REVIEW';
  }

  trace.push({
    at: new Date().toISOString(),
    stage: 'GATE_3_KNOWLEDGE',
    decision: gate3Decision,
    reason_codes: [...gate3Problems],
  });

  if (gate3Decision === 'REVIEW') {
    review_reasons.push(...gate3Problems);
    return buildFinalResponse(rawReportId, 'REVIEW', null, review_reasons, [], trace, 202);
  }

  // -------------------------------------------------------------
  // NODE 11: Mock Ticket Creation (n8n Phase 5 behavior)
  // -------------------------------------------------------------
  const priority: Priority =
    detectedSeverity === 'HIGH' ? 'HIGH' : detectedSeverity === 'LOW' ? 'LOW' : 'NORMAL';

  const demoTicket: TicketDemo = {
    ticket_id: `DEMO-TKT-${rawReportId}`,
    report_id: rawReportId,
    status: 'TICKET_CREATED',
    category: detectedCategory,
    severity: detectedSeverity,
    priority,
    department: assignedDept,
    location: validatedLocation,
    anonymized_media_ref: null,
    procedure,
    sources,
    deadline: null,
    persisted: false, // Standard n8n demo workflow sets false; Member 5 backend then persists it
    storage_status: 'MOCK_ONLY',
    is_mock: true,
  };

  trace.push({
    at: new Date().toISOString(),
    stage: 'TICKET_CREATION',
    decision: 'PASS',
    reason_codes: ['DEMO_TICKET_NOT_SAVED'],
  });

  return buildFinalResponse(rawReportId, 'PASS', demoTicket, [], [], trace, 200);
}

function buildFinalResponse(
  report_id: string | null,
  decision: 'PASS' | 'REVIEW' | 'REJECT',
  ticket: TicketDemo | null,
  review_reasons: string[],
  errors: string[],
  trace: AuditStage[],
  http_status: number
): MunicipalReportResponse {
  return {
    report_id,
    decision,
    ticket,
    review_reasons,
    errors,
    demo_mode: true,
    agents_are_mock: true,
    notice:
      'Demo only: Intake/Vision/Knowledge results are fixture-based; no actual image inference, verified municipal procedure or saved ticket.',
    versions: {
      orchestrator: 'member1-v4',
      intake: 'mock-intake-v1',
      vision: 'mock-vision-v1',
      knowledge: 'mock-knowledge-v1',
    },
    trace,
    audit: {
      report_id,
      decided_at: new Date().toISOString(),
      outcome: decision,
      stages: trace,
      agent_versions: {
        orchestrator: 'member1-v4',
        intake: 'mock-intake-v1',
        vision: 'mock-vision-v1',
        knowledge: 'mock-knowledge-v1',
      },
      storage: ticket?.persisted ? 'PERSISTED' : 'MOCK_ONLY',
    },
    http_status,
  };
}
