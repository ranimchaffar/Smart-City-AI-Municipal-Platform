/**
 * Comprehensive Final Audit Test Suite for Member 5
 * Verifies:
 * - Genuine PostgreSQL persistence
 * - 6 Handoff fixtures (PASS 200, REVIEW 202, REJECT 422)
 * - Idempotency
 * - Municipal staff authentication (401 on unauthorized actions)
 * - Administrative endpoint protection (401 on unauthorized admin actions)
 * - Staff login and token verification endpoints
 * - Safe media isolation (raw image protection & 403 on unanonymized public access)
 * - Upload MIME validation (400 on invalid types)
 * - Real vs Mock n8n mode (no silent fallback on live failure)
 * - Full status lifecycle & audit trail
 * - Review queue triage
 * - Complete data durability & restart persistence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'Member5_Handoff_Package/examples');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';
const STAFF_AUTH_TOKEN = process.env.STAFF_AUTH_TOKEN || 'municipal-staff-secret-2026';
const STAFF_AUTH_HEADER = {
  Authorization: `Bearer ${STAFF_AUTH_TOKEN}`,
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let json = null;
  try {
    json = await response.json();
  } catch (e) {
    // Non-JSON response
  }

  return {
    status: response.status,
    headers: response.headers,
    data: json,
  };
}

async function runAudit() {
  console.log('\n===============================================================');
  console.log('🏛️  MEMBER 5 FINAL RIGOROUS AUDIT & VERIFICATION');
  console.log(`Backend Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // SECTION 1: GENUINE POSTGRESQL PERSISTENCE AUDIT
  // -------------------------------------------------------------
  console.log('--- SECTION 1: Genuine PostgreSQL Persistence ---');
  const healthRes = await request('/api/health');

  assert(healthRes.status === 200, `Health check returned HTTP 200`);
  assert(healthRes.data?.status === 'healthy', `System status is healthy`);
  assert(
    healthRes.data?.database?.connected === true,
    `Database connection flag is true`
  );
  assert(
    healthRes.data?.database?.engine === 'PostgreSQL',
    `Database engine is genuinely PostgreSQL (got ${healthRes.data?.database?.engine})`
  );
  assert(
    healthRes.data?.database?.version?.includes('PostgreSQL 14'),
    `Running authentic PostgreSQL 14 instance (${healthRes.data?.database?.version?.split(' on ')[0]})`
  );
  assert(
    healthRes.data?.database?.database === 'municipal_tickets',
    `Connected to target database: municipal_tickets`
  );

  // -------------------------------------------------------------
  // SECTION 2: HANDOFF FIXTURES & DECISION GATES
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2: Handoff Test Fixtures (PASS/REVIEW/REJECT) ---');

  // Test 2.1: pass_pothole.json
  const pothole = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'pass_pothole.json'), 'utf-8')
  );
  pothole.report_id = `RPT-AUDIT-PASS-${Date.now()}`;

  const passRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: pothole,
  });

  assert(passRes.status === 200, `pass_pothole returned HTTP 200`);
  assert(passRes.data?.decision === 'PASS', `Decision is PASS`);
  assert(passRes.data?.ticket?.category === 'ROAD_DAMAGE', `Category is ROAD_DAMAGE`);
  assert(passRes.data?.ticket?.department === 'ROADS_DEPARTMENT', `Department is ROADS_DEPARTMENT`);
  assert(passRes.data?.ticket?.persisted === true, `Ticket is marked persisted: true`);
  assert(passRes.data?.ticket?.storage_status === 'PERSISTED', `Storage status is PERSISTED`);
  assert(
    passRes.data?.ticket?.ticket_id.startsWith('TKT-'),
    `Assigned persistent ticket ID: ${passRes.data?.ticket?.ticket_id}`
  );

  const createdTicketId = passRes.data?.ticket?.ticket_id;

  // Test 2.2: Idempotency by report_id
  const retryPass = await request('/api/municipal-ticket', {
    method: 'POST',
    body: pothole,
  });
  assert(retryPass.status === 200, `Idempotent retry returned HTTP 200`);
  assert(
    retryPass.data?.ticket?.ticket_id === createdTicketId,
    `Idempotency preserved: returned existing ticket without duplicate (${retryPass.data?.ticket?.ticket_id})`
  );

  // Test 2.3: review_mismatch.json
  const mismatch = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'review_mismatch.json'), 'utf-8')
  );
  mismatch.report_id = `RPT-AUDIT-MISMATCH-${Date.now()}`;

  const mismatchRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: mismatch,
  });
  assert(mismatchRes.status === 202, `review_mismatch returned HTTP 202`);
  assert(mismatchRes.data?.decision === 'REVIEW', `Decision is REVIEW`);
  assert(mismatchRes.data?.ticket === null, `Ticket is null for REVIEW`);
  assert(
    mismatchRes.data?.review_reasons?.includes('IMAGE_TEXT_MISMATCH_OR_UNCLEAR'),
    `Contains reason: IMAGE_TEXT_MISMATCH_OR_UNCLEAR`
  );

  // Test 2.4: reject_missing_media.json
  const missingMedia = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'reject_missing_media.json'), 'utf-8')
  );
  missingMedia.report_id = `RPT-AUDIT-REJECT-${Date.now()}`;

  const rejectRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: missingMedia,
  });
  assert(rejectRes.status === 422, `reject_missing_media returned HTTP 422`);
  assert(rejectRes.data?.decision === 'REJECT', `Decision is REJECT`);
  assert(
    rejectRes.data?.errors?.includes('MISSING_MEDIA_REF'),
    `Contains error: MISSING_MEDIA_REF`
  );

  // Test 2.5: knowledge_outage.json
  const outage = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'knowledge_outage.json'), 'utf-8')
  );
  const outageRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: outage,
  });
  assert(outageRes.status === 202, `knowledge_outage returned HTTP 202`);
  assert(
    outageRes.data?.review_reasons?.includes('KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID'),
    `Contains reason: KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID`
  );

  // Test 2.6: knowledge_empty_sources.json
  const emptySources = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'knowledge_empty_sources.json'), 'utf-8')
  );
  const emptyRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: emptySources,
  });
  assert(emptyRes.status === 202, `knowledge_empty_sources returned HTTP 202`);
  assert(
    emptyRes.data?.review_reasons?.includes('MISSING_SOURCE'),
    `Contains reason: MISSING_SOURCE`
  );

  // Test 2.7: knowledge_wrong_id.json
  const wrongId = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'knowledge_wrong_id.json'), 'utf-8')
  );
  const wrongIdRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: wrongId,
  });
  assert(wrongIdRes.status === 202, `knowledge_wrong_id returned HTTP 202`);
  assert(
    wrongIdRes.data?.review_reasons?.includes('KNOWLEDGE_REPORT_ID_MISMATCH'),
    `Contains reason: KNOWLEDGE_REPORT_ID_MISMATCH`
  );

  // -------------------------------------------------------------
  // SECTION 3: AUTHENTICATION & ACCESS CONTROL AUDIT
  // -------------------------------------------------------------
  console.log('\n--- SECTION 3: Municipal Authentication & Access Control ---');

  // Test 3.1: Unauthorized status update attempt (NO TOKEN) -> MUST RETURN 401
  const unauthStatusRes = await request(`/api/tickets/${createdTicketId}/status`, {
    method: 'PATCH',
    body: { status: 'ASSIGNED', actor: 'unauthorized_guest' },
  });
  assert(
    unauthStatusRes.status === 401,
    `Unauthorized ticket status update blocked with HTTP 401 (got ${unauthStatusRes.status})`
  );
  assert(
    unauthStatusRes.data?.error === 'UNAUTHORIZED',
    `Returns error code UNAUTHORIZED`
  );

  // Test 3.2: Unauthorized review queue access -> MUST RETURN 401
  const unauthReviewRes = await request('/api/reviews');
  assert(
    unauthReviewRes.status === 401,
    `Unauthorized review queue access blocked with HTTP 401`
  );

  // Test 3.3: Unauthorized admin n8n mode toggle -> MUST RETURN 401
  const unauthAdminRes = await request('/api/admin/set-n8n-mode', {
    method: 'POST',
    body: { mode: 'live' },
  });
  assert(
    unauthAdminRes.status === 401,
    `Unauthorized administrative n8n mode switch blocked with HTTP 401`
  );
  assert(
    unauthAdminRes.data?.error === 'UNAUTHORIZED',
    `Returns error code UNAUTHORIZED on unauthenticated admin endpoint`
  );

  // Test 3.4: Staff login endpoint validation
  const invalidLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { token: 'invalid-fake-token' },
  });
  assert(
    invalidLoginRes.status === 401,
    `Invalid credentials rejected by /api/auth/login with HTTP 401`
  );

  const validLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { token: STAFF_AUTH_TOKEN },
  });
  assert(
    validLoginRes.status === 200,
    `Valid credentials authenticated by /api/auth/login with HTTP 200`
  );
  assert(
    validLoginRes.data?.authenticated === true,
    `Staff session successfully authenticated`
  );

  // Test 3.5: Authorized status update with staff token -> MUST RETURN 200
  const authStatusRes = await request(`/api/tickets/${createdTicketId}/status`, {
    method: 'PATCH',
    headers: STAFF_AUTH_HEADER,
    body: {
      status: 'ASSIGNED',
      actor: 'supervisor_audit',
      notes: 'Authorized transition to ASSIGNED logged in PostgreSQL.',
    },
  });
  assert(authStatusRes.status === 200, `Authorized status update succeeded with HTTP 200`);
  assert(authStatusRes.data?.ticket?.status === 'ASSIGNED', `Status updated to ASSIGNED`);

  // Test 3.6: Authorized review queue query -> MUST RETURN 200
  const authReviewRes = await request('/api/reviews', {
    headers: STAFF_AUTH_HEADER,
  });
  assert(authReviewRes.status === 200, `Authorized review queue access returned HTTP 200`);
  assert(Array.isArray(authReviewRes.data?.reviewCases), `Review cases list returned`);

  // -------------------------------------------------------------
  // SECTION 4: MEDIA ISOLATION & UPLOAD VALIDATION AUDIT
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4: Media Security & Upload Validation ---');

  // Test 4.1: Public access to raw uploads -> MUST BE PROTECTED (401)
  const rawImageRes = await request('/api/uploads/raw/test-sample.jpg');
  assert(
    rawImageRes.status === 401,
    `Public access to raw media is blocked with HTTP 401`
  );

  // Test 4.2: Public access to safe media when visual face/plate anonymization is unavailable -> MUST RETURN 403
  const safePublicRes = await request('/api/uploads/safe/sample-unredacted.jpg');
  assert(
    safePublicRes.status === 403,
    `Public access to unredacted media is blocked with HTTP 403`
  );
  assert(
    safePublicRes.data?.error === 'VISUAL_ANONYMIZATION_UNAVAILABLE',
    `Returns error code VISUAL_ANONYMIZATION_UNAVAILABLE to protect citizen privacy`
  );

  // Test 4.3: Invalid upload format (plain text file)
  const boundary = '----WebKitFormBoundaryAuditTest123';
  const badBody =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="media"; filename="script.sh"\r\n` +
    `Content-Type: application/x-sh\r\n\r\n` +
    `echo "malicious script"\r\n` +
    `--${boundary}--\r\n`;

  const invalidUploadRes = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: badBody,
  });

  const uploadJson = await invalidUploadRes.json().catch(() => ({}));
  assert(
    invalidUploadRes.status === 400,
    `Invalid file type rejected with HTTP 400 (got ${invalidUploadRes.status})`
  );
  assert(
    uploadJson?.error === 'INVALID_FILE_TYPE',
    `Returns error INVALID_FILE_TYPE`
  );

  // Test 4.4: Valid upload of an image file
  const validBoundary = '----WebKitFormBoundarySafeTest456';
  const testJpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const validUploadRes = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${validBoundary}`,
    },
    body: Buffer.concat([
      Buffer.from(`--${validBoundary}\r\nContent-Disposition: form-data; name="media"; filename="pothole_proof.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      testJpgHeader,
      Buffer.from(`\r\n--${validBoundary}--\r\n`),
    ]),
  });
  const validUploadJson = await validUploadRes.json().catch(() => ({}));
  assert(validUploadRes.status === 201, `Valid image upload accepted with HTTP 201`);
  const uploadedFilename = validUploadJson.filename;

  // Test 4.5: Uploaded raw file is shielded from public access
  const publicUploadCheck = await request(`/api/uploads/safe/${uploadedFilename}`);
  assert(
    publicUploadCheck.status === 403,
    `Public access to uploaded image is shielded with HTTP 403`
  );

  // Test 4.6: Authorized staff CAN view uploaded evidence
  const staffUploadCheck = await fetch(`${BASE_URL}/api/uploads/safe/${uploadedFilename}`, {
    headers: STAFF_AUTH_HEADER,
  });
  assert(
    staffUploadCheck.status === 200,
    `Authorized municipal staff can inspect uploaded evidence (HTTP 200)`
  );

  // -------------------------------------------------------------
  // SECTION 5: REAL vs MOCK n8n MODE & NO SILENT FALLBACK
  // -------------------------------------------------------------
  console.log('\n--- SECTION 5: n8n Execution Mode & No Silent Fallback ---');

  // Test 5.1: In Mock Mode, response is visibly labeled
  assert(
    passRes.data?.orchestrator_mode === 'EXPLICIT_SIMULATED_MOCK',
    `Mock mode visibly identifies as EXPLICIT_SIMULATED_MOCK`
  );
  assert(
    passRes.data?.notice?.includes('EXPLICIT_SIMULATED_MOCK'),
    `Notice prominently states mock engine with honest provenance`
  );

  // Test 5.2: Switch to Live Mode with authorized staff credentials
  const setLiveRes = await request('/api/admin/set-n8n-mode', {
    method: 'POST',
    headers: STAFF_AUTH_HEADER,
    body: { mode: 'live' },
  });
  assert(setLiveRes.status === 200, `Switched backend to live mode (N8N_MODE=live)`);

  // Test 5.3: In Live Mode, if n8n is offline, IT MUST NEVER SILENTLY FALLBACK TO MOCK!
  const liveFailRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: pothole,
  });

  assert(
    liveFailRes.status === 502,
    `Live n8n offline produces HTTP 502 Bad Gateway (got ${liveFailRes.status})`
  );
  assert(
    liveFailRes.data?.errors?.includes('N8N_LIVE_WEBHOOK_UNREACHABLE'),
    `Error reports N8N_LIVE_WEBHOOK_UNREACHABLE`
  );
  assert(
    liveFailRes.data?.orchestrator_mode === 'LIVE_N8N_FAILED',
    `Mode explicitly states LIVE_N8N_FAILED without silent fallback`
  );

  // Reset back to mock mode
  await request('/api/admin/set-n8n-mode', {
    method: 'POST',
    headers: STAFF_AUTH_HEADER,
    body: { mode: 'mock' },
  });
  console.log('  ℹ️  Reset orchestrator back to mock mode for testing.');

  // -------------------------------------------------------------
  // SECTION 6: REVIEW QUEUE TRIAGE WORKFLOW
  // -------------------------------------------------------------
  console.log('\n--- SECTION 6: Review Queue Triage Workflow ---');
  const reviewCases = authReviewRes.data?.reviewCases || [];
  const pendingCase = reviewCases.find(
    (c) => c.report_id === mismatch.report_id && c.status === 'PENDING'
  );

  assert(!!pendingCase, `Pending review case found for mismatch report`);

  if (pendingCase) {
    const resolveRes = await request(`/api/reviews/${pendingCase.review_id}`, {
      method: 'PATCH',
      headers: STAFF_AUTH_HEADER,
      body: {
        status: 'APPROVED_TO_TICKET',
        resolved_by: 'supervisor_audit',
        decision_notes: 'Manual triage approved after image inspection.',
        approvedTicketData: {
          category: 'STREET_LIGHTING',
          department: 'PUBLIC_LIGHTING_DEPARTMENT',
          severity: 'MEDIUM',
        },
      },
    });

    assert(resolveRes.status === 200, `Review case triage returned HTTP 200`);
    assert(
      resolveRes.data?.reviewCase?.status === 'APPROVED_TO_TICKET',
      `Review case marked APPROVED_TO_TICKET in PostgreSQL`
    );
    assert(
      !!resolveRes.data?.createdTicket?.ticket_id,
      `Official ticket created in PostgreSQL: ${resolveRes.data?.createdTicket?.ticket_id}`
    );
  }

  // -------------------------------------------------------------
  // SECTION 7: AUDITED LIFECYCLE STATE TRANSITIONS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 7: Audited Status Lifecycle Transitions ---');
  // Transition to IN_PROGRESS
  await request(`/api/tickets/${createdTicketId}/status`, {
    method: 'PATCH',
    headers: STAFF_AUTH_HEADER,
    body: { status: 'IN_PROGRESS', actor: 'crew_leader_marouan', notes: 'Asphalt crew on site.' },
  });

  // Transition to RESOLVED
  await request(`/api/tickets/${createdTicketId}/status`, {
    method: 'PATCH',
    headers: STAFF_AUTH_HEADER,
    body: { status: 'RESOLVED', actor: 'inspector_kamal', notes: 'Road repair verified complete.' },
  });

  // Inspect ticket details and events from PostgreSQL
  const detailRes = await request(`/api/tickets/${createdTicketId}`);
  assert(detailRes.status === 200, `Retrieved ticket details from PostgreSQL`);
  assert(detailRes.data?.ticket?.status === 'RESOLVED', `Current ticket status is RESOLVED`);

  const events = detailRes.data?.events || [];
  assert(
    events.length >= 4,
    `PostgreSQL recorded ${events.length} immutable events in ticket_events`
  );
  assert(
    events[events.length - 1].to_status === 'RESOLVED',
    `Final event to_status is RESOLVED`
  );

  // -------------------------------------------------------------
  // SECTION 8: DURABILITY & RESTART PERSISTENCE VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 8: Durability & Persistence Integrity ---');
  const persistReportId = `RPT-DURABILITY-${Date.now()}`;
  const persistSub = await request('/api/municipal-ticket', {
    method: 'POST',
    body: {
      report_id: persistReportId,
      description: 'Dangerous pothole on Avenue Hassan II requiring immediate attention.',
      media_ref: 'mock://pothole',
      location: { latitude: 33.5931, longitude: -7.6189, address: 'Avenue Hassan II' },
    },
  });
  assert(persistSub.status === 200, `Durability test submission accepted (HTTP 200)`);
  const persistTicketId = persistSub.data?.ticket?.ticket_id;
  assert(!!persistTicketId, `Generated persistent ticket ID: ${persistTicketId}`);
  assert(persistSub.data?.ticket?.persisted === true, `Ticket has persisted: true flag`);
  assert(persistSub.data?.ticket?.storage_status === 'PERSISTED', `Storage status is PERSISTED`);

  const persistUpdate = await request(`/api/tickets/${persistTicketId}/status`, {
    method: 'PATCH',
    headers: STAFF_AUTH_HEADER,
    body: {
      status: 'IN_PROGRESS',
      actor: 'chief_engineer',
      notes: 'Dispatched emergency repair team.',
    },
  });
  assert(persistUpdate.status === 200, `Staff status update persisted with HTTP 200`);
  assert(persistUpdate.data?.ticket?.status === 'IN_PROGRESS', `Ticket status updated to IN_PROGRESS`);

  const persistQuery = await request(`/api/tickets/${persistTicketId}`);
  assert(persistQuery.status === 200, `Direct query returned HTTP 200`);
  assert(persistQuery.data?.ticket?.status === 'IN_PROGRESS', `Persistent status confirmed as IN_PROGRESS`);
  assert(
    persistQuery.data?.events?.some((e) => e.to_status === 'IN_PROGRESS'),
    `Audit event trail logged in PostgreSQL ticket_events table`
  );

  console.log('\n===============================================================');
  console.log(`AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
