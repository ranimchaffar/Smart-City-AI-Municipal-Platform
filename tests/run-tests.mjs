/**
 * Member 5 Integration & Verification Test Suite
 * Tests all 6 handoff fixtures, API endpoints, ticket persistence,
 * review queue, and lifecycle state transitions.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'Member5_Handoff_Package/examples');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';

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

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
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

async function runAllTests() {
  console.log('\n===============================================================');
  console.log('🏛️  MEMBER 5 INTEGRATION & VERIFICATION TEST SUITE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('===============================================================\n');

  // Test 0: Health Check
  console.log('--- TEST 0: Health Check ---');
  const healthRes = await request('/api/health');
  assert(healthRes.status === 200, `Health check HTTP 200 (got ${healthRes.status})`);
  assert(healthRes.data?.status === 'healthy', 'Health status is "healthy"');

  // Test 1: pass_pothole.json (Expected: 200 PASS + DB Persistence)
  console.log('\n--- TEST 1: Fixture pass_pothole.json ---');
  const potholeFixture = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'pass_pothole.json'), 'utf-8')
  );
  // Ensure a unique report ID for test tracking
  potholeFixture.report_id = `RPT-TEST-POTHOLE-${Date.now()}`;

  const passRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: potholeFixture,
  });

  assert(passRes.status === 200, `Expected HTTP 200 (got ${passRes.status})`);
  assert(passRes.data?.decision === 'PASS', `Decision is PASS (got ${passRes.data?.decision})`);
  assert(passRes.data?.ticket !== null, 'Ticket object is populated');
  assert(passRes.data?.ticket?.category === 'ROAD_DAMAGE', 'Category is ROAD_DAMAGE');
  assert(passRes.data?.ticket?.department === 'ROADS_DEPARTMENT', 'Department is ROADS_DEPARTMENT');
  assert(passRes.data?.ticket?.persisted === true, 'Ticket is marked persisted: true in DB');
  assert(passRes.data?.ticket?.storage_status === 'PERSISTED', 'Storage status is PERSISTED');
  assert(
    passRes.data?.ticket?.ticket_id.startsWith('TKT-'),
    `Assigned real ticket_id: ${passRes.data?.ticket?.ticket_id}`
  );

  const createdTicketId = passRes.data?.ticket?.ticket_id;

  // Test 2: Idempotent Submission (Re-submitting the same report_id)
  console.log('\n--- TEST 2: Idempotency by report_id ---');
  const retryRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: potholeFixture,
  });

  assert(retryRes.status === 200, `Expected HTTP 200 on retry (got ${retryRes.status})`);
  assert(
    retryRes.data?.ticket?.ticket_id === createdTicketId,
    `Returned existing ticket_id without duplicate (${retryRes.data?.ticket?.ticket_id})`
  );

  // Test 3: review_mismatch.json (Expected: 202 REVIEW + Review Case Created)
  console.log('\n--- TEST 3: Fixture review_mismatch.json ---');
  const mismatchFixture = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'review_mismatch.json'), 'utf-8')
  );
  mismatchFixture.report_id = `RPT-TEST-MISMATCH-${Date.now()}`;

  const reviewRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: mismatchFixture,
  });

  assert(reviewRes.status === 202, `Expected HTTP 202 (got ${reviewRes.status})`);
  assert(reviewRes.data?.decision === 'REVIEW', `Decision is REVIEW (got ${reviewRes.data?.decision})`);
  assert(reviewRes.data?.ticket === null, 'Ticket is null for REVIEW');
  assert(
    reviewRes.data?.review_reasons?.includes('IMAGE_TEXT_MISMATCH_OR_UNCLEAR'),
    'Review reason includes IMAGE_TEXT_MISMATCH_OR_UNCLEAR'
  );

  // Verify it was added to the review queue
  const reviewQueueRes = await request('/api/reviews');
  const queuedCase = reviewQueueRes.data?.reviewCases?.find(
    (r) => r.report_id === mismatchFixture.report_id
  );
  assert(!!queuedCase, `Review case REV-${mismatchFixture.report_id} found in review queue`);
  assert(queuedCase?.status === 'PENDING', 'Review case is in PENDING status');

  // Test 4: reject_missing_media.json (Expected: 422 REJECT)
  console.log('\n--- TEST 4: Fixture reject_missing_media.json ---');
  const rejectFixture = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'reject_missing_media.json'), 'utf-8')
  );
  rejectFixture.report_id = `RPT-TEST-REJECT-${Date.now()}`;

  const rejectRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: rejectFixture,
  });

  assert(rejectRes.status === 422, `Expected HTTP 422 (got ${rejectRes.status})`);
  assert(rejectRes.data?.decision === 'REJECT', `Decision is REJECT (got ${rejectRes.data?.decision})`);
  assert(rejectRes.data?.ticket === null, 'Ticket is null for REJECT');
  assert(
    rejectRes.data?.errors?.includes('MISSING_MEDIA_REF'),
    'Error list includes MISSING_MEDIA_REF'
  );

  // Test 5: knowledge_outage.json (Expected: 202 REVIEW)
  console.log('\n--- TEST 5: Fixture knowledge_outage.json ---');
  const outageFixture = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'knowledge_outage.json'), 'utf-8')
  );

  const outageRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: outageFixture,
  });

  assert(outageRes.status === 202, `Expected HTTP 202 (got ${outageRes.status})`);
  assert(outageRes.data?.decision === 'REVIEW', `Decision is REVIEW`);
  assert(
    outageRes.data?.review_reasons?.includes('KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID'),
    'Reason includes KNOWLEDGE_ENDPOINT_FAILED_OR_INVALID'
  );

  // Test 6: knowledge_empty_sources.json (Expected: 202 REVIEW)
  console.log('\n--- TEST 6: Fixture knowledge_empty_sources.json ---');
  const emptySourcesFixture = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'knowledge_empty_sources.json'), 'utf-8')
  );

  const emptyRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: emptySourcesFixture,
  });

  assert(emptyRes.status === 202, `Expected HTTP 202 (got ${emptyRes.status})`);
  assert(emptyRes.data?.decision === 'REVIEW', `Decision is REVIEW`);
  assert(
    emptyRes.data?.review_reasons?.includes('MISSING_SOURCE'),
    'Reason includes MISSING_SOURCE'
  );

  // Test 7: knowledge_wrong_id.json (Expected: 202 REVIEW)
  console.log('\n--- TEST 7: Fixture knowledge_wrong_id.json ---');
  const wrongIdFixture = JSON.parse(
    fs.readFileSync(path.join(EXAMPLES_DIR, 'knowledge_wrong_id.json'), 'utf-8')
  );

  const wrongIdRes = await request('/api/municipal-ticket', {
    method: 'POST',
    body: wrongIdFixture,
  });

  assert(wrongIdRes.status === 202, `Expected HTTP 202 (got ${wrongIdRes.status})`);
  assert(wrongIdRes.data?.decision === 'REVIEW', `Decision is REVIEW`);
  assert(
    wrongIdRes.data?.review_reasons?.includes('KNOWLEDGE_REPORT_ID_MISMATCH'),
    'Reason includes KNOWLEDGE_REPORT_ID_MISMATCH'
  );

  // Test 8: Ticket Lifecycle Status Transition & Audit Trail
  console.log('\n--- TEST 8: Ticket Lifecycle Status Transitions ---');
  if (createdTicketId) {
    // Transition 1: ASSIGNED
    const assignRes = await request(`/api/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      body: {
        status: 'ASSIGNED',
        actor: 'supervisor_faten',
        notes: 'Assigned to North District Pavement Repair Team.',
      },
    });
    assert(assignRes.status === 200, `Ticket status updated to ASSIGNED`);
    assert(assignRes.data?.ticket?.status === 'ASSIGNED', 'Status is ASSIGNED');

    // Transition 2: IN_PROGRESS
    const inProgRes = await request(`/api/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      body: {
        status: 'IN_PROGRESS',
        actor: 'crew_chief_ali',
        notes: 'Pavement sawed, asphalt patching currently under application.',
      },
    });
    assert(inProgRes.status === 200, `Ticket status updated to IN_PROGRESS`);

    // Transition 3: RESOLVED
    const resolvedRes = await request(`/api/tickets/${createdTicketId}/status`, {
      method: 'PATCH',
      body: {
        status: 'RESOLVED',
        actor: 'inspector_moncef',
        notes: 'Resurfacing inspected and confirmed smooth. Road open to traffic.',
      },
    });
    assert(resolvedRes.status === 200, `Ticket status updated to RESOLVED`);

    // Verify audit events
    const ticketDetailsRes = await request(`/api/tickets/${createdTicketId}`);
    assert(ticketDetailsRes.status === 200, `Fetched ticket details`);
    const events = ticketDetailsRes.data?.events || [];
    assert(events.length >= 4, `Recorded ${events.length} audit events in ticket_events log`);
    assert(events[events.length - 1].to_status === 'RESOLVED', 'Final event status is RESOLVED');
  }

  // Test 9: Human Review Resolution (Approve into Ticket)
  console.log('\n--- TEST 9: Human Review Queue Resolution ---');
  if (queuedCase) {
    const resolveRes = await request(`/api/reviews/${queuedCase.review_id}`, {
      method: 'PATCH',
      body: {
        status: 'APPROVED_TO_TICKET',
        resolved_by: 'supervisor_faten',
        decision_notes:
          'Citizen photo inspected manually. Confirmed streetlight issue despite pothole keyword.',
        approvedTicketData: {
          category: 'STREET_LIGHTING',
          severity: 'MEDIUM',
          department: 'PUBLIC_LIGHTING_DEPARTMENT',
          procedure: 'Manual supervisor approval: Replace defective fixture.',
        },
      },
    });

    assert(resolveRes.status === 200, `Review case resolved`);
    assert(
      resolveRes.data?.reviewCase?.status === 'APPROVED_TO_TICKET',
      'Review case status is APPROVED_TO_TICKET'
    );
    assert(!!resolveRes.data?.createdTicket, 'Official ticket created from approved review');
  }

  // Test 10: Operations Stats Endpoint
  console.log('\n--- TEST 10: Operations Stats Endpoint ---');
  const statsRes = await request('/api/stats');
  assert(statsRes.status === 200, `Stats endpoint HTTP 200`);
  assert(typeof statsRes.data?.totalTickets === 'number', `Total tickets: ${statsRes.data?.totalTickets}`);
  assert(typeof statsRes.data?.resolvedTickets === 'number', `Resolved tickets: ${statsRes.data?.resolvedTickets}`);

  // Summary
  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
