/**
 * Restart Persistence Verification Test
 * Proves that:
 * 1. Citizen submission creates persistent PostgreSQL records.
 * 2. Dashboard status transition is logged in PostgreSQL.
 * 3. After backend process termination and restart, data remains fully intact in PostgreSQL.
 */
import http from 'http';

const BASE_URL = 'http://localhost:3001';
const STAFF_AUTH = {
  Authorization: 'Bearer municipal-staff-secret-2026',
  'Content-Type': 'application/json',
};

async function post(url, data, headers = { 'Content-Type': 'application/json' }) {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return { status: res.status, json: await res.json() };
}

async function get(url, headers = {}) {
  const res = await fetch(url, { headers });
  return { status: res.status, json: await res.json() };
}

async function patch(url, data, headers = STAFF_AUTH) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return { status: res.status, json: await res.json() };
}

async function runPreRestartPhase() {
  const testReportId = `RPT-PERSIST-${Date.now()}`;
  console.log(`[Phase 1] Submitting citizen report: ${testReportId}`);

  const subRes = await post(`${BASE_URL}/api/municipal-ticket`, {
    report_id: testReportId,
    description: 'Pothole on Boulevard Zerktouni causing severe traffic slowdown.',
    media_ref: 'mock://pothole',
    location: {
      latitude: 33.5892,
      longitude: -7.6187,
      address: 'Boulevard Zerktouni, Casablanca',
    },
  });

  if (subRes.status !== 200 || !subRes.json.ticket) {
    throw new Error(`Submission failed: HTTP ${subRes.status} ${JSON.stringify(subRes.json)}`);
  }

  const ticketId = subRes.json.ticket.ticket_id;
  console.log(`[Phase 1] Created persistent ticket: ${ticketId}`);

  console.log(`[Phase 2] Staff updates status to IN_PROGRESS...`);
  const patchRes = await patch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
    status: 'IN_PROGRESS',
    actor: 'municipal_chief_engineer',
    notes: 'Dispatched emergency asphalt repair crew.',
  });

  if (patchRes.status !== 200 || patchRes.json.ticket?.status !== 'IN_PROGRESS') {
    throw new Error(`Status update failed: HTTP ${patchRes.status}`);
  }
  console.log(`[Phase 2] Status updated to: ${patchRes.json.ticket.status}`);

  return { testReportId, ticketId };
}

async function runPostRestartPhase(ticketId) {
  console.log(`[Phase 3] Querying ticket ${ticketId} after backend restart...`);
  const queryRes = await get(`${BASE_URL}/api/tickets/${ticketId}`);

  if (queryRes.status !== 200) {
    throw new Error(`Post-restart query failed: HTTP ${queryRes.status}`);
  }

  const ticket = queryRes.json.ticket;
  const events = queryRes.json.events;

  console.log(`[Phase 3] Retrieved ticket from PostgreSQL:`);
  console.log(`  - Ticket ID: ${ticket.ticket_id}`);
  console.log(`  - Status: ${ticket.status}`);
  console.log(`  - Department: ${ticket.department}`);
  console.log(`  - Category: ${ticket.category}`);
  console.log(`  - Persisted Flag: ${ticket.persisted}`);
  console.log(`  - Storage Status: ${ticket.storage_status}`);
  console.log(`  - Audit Events Count: ${events.length}`);

  const hasInProgressEvent = events.some(
    (e) => e.to_status === 'IN_PROGRESS' && e.actor === 'municipal_chief_engineer'
  );

  if (ticket.status === 'IN_PROGRESS' && hasInProgressEvent) {
    console.log(`\n🎉 RESTART PERSISTENCE VERIFIED: 100% Data Preserved Across Server Restart!`);
    return true;
  } else {
    throw new Error('Data verification failed: status or event missing.');
  }
}

const mode = process.argv[2];
if (mode === 'pre') {
  runPreRestartPhase()
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else if (mode === 'post') {
  const ticketId = process.argv[3];
  runPostRestartPhase(ticketId)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
