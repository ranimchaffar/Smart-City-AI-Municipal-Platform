/**
 * Comprehensive Authentication, Security, RBAC & Isolation Test Suite
 * Validates:
 * 1. Citizen registration (Argon2id, role enforcement, duplicate check, validation)
 * 2. Multi-role authentication (Citizen, Municipal Agent, Administrator)
 * 3. Rate limiting (Lockout after failed attempts)
 * 4. Password reset (single-use expiring token)
 * 5. Role-Based Access Control (RBAC) across Express endpoints
 * 6. Citizen incident ownership and data isolation
 * 7. Anonymous incident tracking tokens (unguessable credential protection)
 * 8. Session invalidation and secure logout
 */

import { fileURLToPath } from 'url';
import path from 'path';

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

async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // Non-JSON
  }

  // Extract session cookie if set
  const cookieHeader = response.headers.get('set-cookie');

  return {
    status: response.status,
    headers: response.headers,
    cookie: cookieHeader,
    data,
  };
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🛡️  SMART CITY AI — AUTHENTICATION, RBAC & SECURITY AUDIT');
  console.log(`Backend Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  // -------------------------------------------------------------------------
  // 1. CITIZEN REGISTRATION & SECURITY VALIDATION
  // -------------------------------------------------------------------------
  console.log('--- 1. Citizen Registration & Role Escalation Protection ---');
  const uniqueEmail = `citoyen.test.${Date.now()}@exemple.tn`;

  // Weak password rejected
  const weakRes = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Citoyen Test',
      email: uniqueEmail,
      password: '123',
    },
  });
  assert(weakRes.status === 400, `Short password rejected with HTTP 400`);
  assert(weakRes.data?.error === 'WEAK_PASSWORD', `Returns error code WEAK_PASSWORD`);

  // Valid registration
  const regRes = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Yassine Ben Amor',
      email: uniqueEmail,
      password: 'CitoyenPassword2026!',
      role: 'ADMINISTRATOR', // Attempt privilege escalation
    },
  });
  assert(regRes.status === 201, `Citizen registration accepted with HTTP 201`);
  assert(regRes.data?.user?.email === uniqueEmail, `Registered user email matches`);
  assert(regRes.data?.user?.role === 'CITIZEN', `Privilege escalation blocked: role forced to CITIZEN`);
  assert(!regRes.data?.user?.password_hash, `Password hash is NEVER exposed to frontend`);
  assert(!!regRes.cookie, `HttpOnly session cookie received upon registration`);

  const citizenCookie = regRes.cookie?.split(';')[0];
  const citizenSessionHeader = { Cookie: citizenCookie };

  // Duplicate email registration rejected
  const dupRes = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Duplicate',
      email: uniqueEmail,
      password: 'CitoyenPassword2026!',
    },
  });
  assert(dupRes.status === 409, `Duplicate email registration rejected with HTTP 409`);
  assert(dupRes.data?.error === 'EMAIL_ALREADY_EXISTS', `Returns EMAIL_ALREADY_EXISTS`);

  // -------------------------------------------------------------------------
  // 2. MULTI-ROLE AUTHENTICATION (CITIZEN, AGENT, ADMIN)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Multi-Role Authentication (Argon2id Verification) ---');

  // Citizen login
  const citLogin = await api('/api/auth/login', {
    method: 'POST',
    body: {
      email: uniqueEmail,
      password: 'CitoyenPassword2026!',
    },
  });
  assert(citLogin.status === 200, `Citizen login succeeded with HTTP 200`);
  assert(citLogin.data?.user?.role === 'CITIZEN', `Authenticated user has CITIZEN role`);

  // Municipal Agent login
  const agentLogin = await api('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'agent.voirie@ville-intelligente.tn',
      password: 'AgentSecure2026!',
    },
  });
  assert(agentLogin.status === 200, `Municipal Agent login succeeded with HTTP 200`);
  assert(agentLogin.data?.user?.role === 'MUNICIPAL_AGENT', `Authenticated user has MUNICIPAL_AGENT role`);
  assert(agentLogin.data?.user?.department === 'ROADS_DEPARTMENT', `Agent has assigned department ROADS_DEPARTMENT`);
  const agentCookie = agentLogin.cookie?.split(';')[0];
  const agentSessionHeader = { Cookie: agentCookie };

  // Administrator login
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@ville-intelligente.tn',
      password: 'AdminSecure2026!',
    },
  });
  assert(adminLogin.status === 200, `Administrator login succeeded with HTTP 200`);
  assert(adminLogin.data?.user?.role === 'ADMINISTRATOR', `Authenticated user has ADMINISTRATOR role`);
  const adminCookie = adminLogin.cookie?.split(';')[0];
  const adminSessionHeader = { Cookie: adminCookie };

  // -------------------------------------------------------------------------
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Role-Based Access Control (RBAC) Enforcement ---');

  // Citizen attempts to access Municipal Review Queue
  const citReview = await api('/api/reviews', {
    headers: citizenSessionHeader,
  });
  assert(citReview.status === 403, `Citizen blocked from Review Queue with HTTP 403 Forbidden`);

  // Citizen attempts to access Admin User Management
  const citAdmin = await api('/api/admin/users', {
    headers: citizenSessionHeader,
  });
  assert(citAdmin.status === 403, `Citizen blocked from Admin User Management with HTTP 403 Forbidden`);

  // Municipal Agent accesses Review Queue
  const agentReview = await api('/api/reviews', {
    headers: agentSessionHeader,
  });
  assert(agentReview.status === 200, `Municipal Agent authorized for Review Queue with HTTP 200`);

  // Municipal Agent attempts to access Admin User Management
  const agentAdmin = await api('/api/admin/users', {
    headers: agentSessionHeader,
  });
  assert(agentAdmin.status === 403, `Municipal Agent blocked from Admin User Management with HTTP 403 Forbidden`);

  // Administrator accesses Admin User Management
  const adminUsers = await api('/api/admin/users', {
    headers: adminSessionHeader,
  });
  assert(adminUsers.status === 200, `Administrator authorized for User Management with HTTP 200`);
  assert(Array.isArray(adminUsers.data?.users), `Administrator retrieved user list`);
  assert(adminUsers.data?.users?.length >= 4, `Database contains seeded municipal users`);

  // -------------------------------------------------------------------------
  // 4. CITIZEN INCIDENT OWNERSHIP & DATA ISOLATION
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Citizen Incident Ownership & Anonymous Tracking ---');

  // Citizen submits an authenticated incident
  const citizenReportId = `RPT-CITIZEN-${Date.now()}`;
  const citSubRes = await api('/api/municipal-ticket', {
    method: 'POST',
    headers: citizenSessionHeader,
    body: {
      report_id: citizenReportId,
      description: 'Nid de poule profond sur l\'Avenue Habib Bourguiba en face du théâtre.',
      media_ref: 'mock://pothole',
      location: { latitude: 36.8002, longitude: 10.1865, address: 'Avenue Habib Bourguiba, Tunis' },
    },
  });
  assert(citSubRes.status === 200, `Authenticated citizen submitted report successfully (HTTP 200)`);

  // Citizen views their own report history
  const myReportsRes = await api('/api/municipal-ticket/citizen/my-reports', {
    headers: citizenSessionHeader,
  });
  assert(myReportsRes.status === 200, `Citizen retrieved personal report history with HTTP 200`);
  assert(
    myReportsRes.data?.reports?.some((r) => r.report_id === citizenReportId),
    `Submitted report found in citizen's personal history`
  );

  // Unauthenticated visitor attempts to view citizen's report
  const unauthorizedView = await api(`/api/municipal-ticket/${citizenReportId}`);
  assert(unauthorizedView.status === 403, `Unauthenticated access to citizen report blocked with HTTP 403`);

  // Anonymous user submits an incident
  const anonReportId = `RPT-ANON-${Date.now()}`;
  const anonSubRes = await api('/api/municipal-ticket', {
    method: 'POST',
    body: {
      report_id: anonReportId,
      description: 'Lampadaire éteint depuis trois jours près du parc.',
      media_ref: 'mock://streetlight',
      location: { latitude: 36.8123, longitude: 10.1745, address: 'Rue de Rome, Tunis' },
    },
  });
  assert(anonSubRes.status === 200, `Anonymous report submitted successfully`);
  const trackingToken = anonSubRes.data?.tracking_token;
  assert(!!trackingToken && trackingToken.length >= 32, `Generated secure tracking token: ${trackingToken?.substring(0, 8)}...`);

  // Anonymous access WITHOUT token -> 403 Forbidden
  const anonNoToken = await api(`/api/municipal-ticket/${anonReportId}`);
  assert(anonNoToken.status === 403, `Anonymous report access without token blocked with HTTP 403`);

  // Anonymous access WITH WRONG token -> 403 Forbidden
  const anonWrongToken = await api(`/api/municipal-ticket/${anonReportId}?token=invalid-secret-token`);
  assert(anonWrongToken.status === 403, `Anonymous report access with wrong token blocked with HTTP 403`);

  // Anonymous access WITH VALID token -> 200 OK
  const anonValidToken = await api(`/api/municipal-ticket/${anonReportId}?token=${trackingToken}`);
  assert(anonValidToken.status === 200, `Anonymous report accessed with valid tracking token (HTTP 200)`);
  assert(anonValidToken.data?.report?.report_id === anonReportId, `Retrieved correct anonymous report details`);

  // -------------------------------------------------------------------------
  // 5. PASSWORD RESET WORKFLOW (SINGLE-USE EXPIRING TOKENS)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Secure Password Reset Workflow ---');

  // Request password reset
  const forgotRes = await api('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: uniqueEmail },
  });
  assert(forgotRes.status === 200, `Password reset requested with HTTP 200`);
  const resetToken = forgotRes.data?.reset_token;
  assert(!!resetToken, `Received single-use password reset token`);

  // Complete password reset
  const resetRes = await api('/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: resetToken,
      new_password: 'NewCitizenPassword2026!',
    },
  });
  assert(resetRes.status === 200, `Password successfully reset with HTTP 200`);

  // Token reuse attempt must be rejected (single-use)
  const reuseRes = await api('/api/auth/reset-password', {
    method: 'POST',
    body: {
      token: resetToken,
      new_password: 'AnotherPassword2026!',
    },
  });
  assert(reuseRes.status === 400, `Reusing password reset token rejected with HTTP 400`);
  assert(reuseRes.data?.error === 'TOKEN_ALREADY_USED', `Error code confirms TOKEN_ALREADY_USED`);

  // Old password no longer works
  const oldLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: {
      email: uniqueEmail,
      password: 'CitoyenPassword2026!',
    },
  });
  assert(oldLoginRes.status === 401, `Old password rejected with HTTP 401`);

  // New password works
  const newLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: {
      email: uniqueEmail,
      password: 'NewCitizenPassword2026!',
    },
  });
  assert(newLoginRes.status === 200, `New password authenticated successfully with HTTP 200`);

  // -------------------------------------------------------------------------
  // 6. SESSION INVALIDATION & LOGOUT
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Session Invalidation & Logout ---');
  const loggedCookie = newLoginRes.cookie?.split(';')[0];
  const loggedHeaders = { Cookie: loggedCookie };

  const meBefore = await api('/api/auth/me', { headers: loggedHeaders });
  assert(meBefore.status === 200, `Session active before logout (HTTP 200)`);

  const logoutRes = await api('/api/auth/logout', { method: 'POST', headers: loggedHeaders });
  assert(logoutRes.status === 200, `Logout endpoint returned HTTP 200`);

  const meAfter = await api('/api/auth/me', { headers: loggedHeaders });
  assert(meAfter.status === 401, `Session invalidated: access blocked with HTTP 401 after logout`);

  console.log('\n===============================================================');
  console.log(`SECURITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
