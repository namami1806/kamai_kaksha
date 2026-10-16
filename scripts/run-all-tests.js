import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kbPath = path.resolve(__dirname, '../data/knowledge_base.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpRequest(urlStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      const dataStr = typeof body === 'string' ? body : JSON.stringify(body);
      req.write(dataStr);
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName}`);
    failed++;
  }
}

let spawnedServer = null;

async function ensureServerRunning() {
  try {
    const health = await httpRequest('http://127.0.0.1:5001/api/health');
    if (health.statusCode === 200) return;
  } catch (e) {
    // Server not running, spawn it
  }
  const { spawn } = await import('child_process');
  spawnedServer = spawn('node', ['src/index.js'], {
    cwd: path.resolve(__dirname, '../server'),
    env: { ...process.env, PORT: '5001', CLIENT_ORIGIN: 'http://localhost:5173' },
    stdio: 'ignore'
  });
  for (let i = 0; i < 30; i++) {
    await sleep(200);
    try {
      const h = await httpRequest('http://127.0.0.1:5001/api/health');
      if (h.statusCode === 200) return;
    } catch (err) {}
  }
}

async function run() {
  console.log('================================================================');
  console.log('KAMAI KAKSHA AUTOMATED REGRESSION SUITE (npm test)');
  console.log('================================================================\n');

  await ensureServerRunning();
  try {

  // -------------------------------------------------------------------------
  // TEST SUITE 1: Knowledge Base Validation (SAMPLE- prefix & Disclaimers)
  // -------------------------------------------------------------------------
  console.log('[Suite 1: Knowledge Base Modelled Data Integrity]');
  const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

  // 1a. Courses
  const allCoursesSample = kb.courses.every(c => c.id.startsWith('SAMPLE-CRS-'));
  assert(allCoursesSample, `All ${kb.courses.length} courses prefixed with SAMPLE-CRS-`);
  
  // 1b. Apprenticeships
  const allAppSample = kb.apprenticeships.every(a => a.id.startsWith('SAMPLE-APPR-'));
  assert(allAppSample, `All ${kb.apprenticeships.length} apprenticeships prefixed with SAMPLE-APPR-`);

  // 1c. Local Jobs
  const allJobsSample = kb.local_jobs.every(j => j.id.startsWith('SAMPLE-JOB-'));
  assert(allJobsSample, `All ${kb.local_jobs.length} local jobs prefixed with SAMPLE-JOB-`);

  // 1d. Sample Tasks (via API)
  const tasksRes = await httpRequest('http://127.0.0.1:5001/api/tasks');
  const allTasksSample = tasksRes.body?.tasks?.every(t => t.id.startsWith('SAMPLE-TSK-'));
  assert(allTasksSample, `All microtasks from server prefixed with SAMPLE-TSK-`);

  // 1e. Sample Flags
  const allSampleFlag = kb.courses.every(c => c.sample_flag === true) && kb.apprenticeships.every(a => a.sample_flag === true) && kb.local_jobs.every(j => j.sample_flag === true);
  assert(allSampleFlag, 'All catalog entries contain sample_flag: true');

  // -------------------------------------------------------------------------
  // TEST SUITE 2: Sync Queue API (Telemetry, Idempotency & Auth)
  // -------------------------------------------------------------------------
  console.log('\n[Suite 2: Offline Sync Queue API & Idempotency]');
  const eventId = `test_evt_${Date.now()}`;
  const syncEvent = {
    id: eventId,
    studentId: 'priya_17',
    eventType: 'TEST_HEARTBEAT',
    itemId: 'SAMPLE-CRS-SOLAR-101',
    timestamp: new Date().toISOString()
  };

  const syncRes = await httpRequest('http://127.0.0.1:5001/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token_priya_17'
    }
  }, syncEvent);

  assert(syncRes.statusCode === 200, `POST /api/sync with valid token returns HTTP 200 (Got ${syncRes.statusCode})`);
  assert(syncRes.body?.status === 'acknowledged', `Sync event acknowledged by server`);
  assert(syncRes.body?.eventId === eventId, `Sync returns matching eventId: ${eventId}`);

  // 2b. Unauthorized cross-student sync rejection
  const badSyncRes = await httpRequest('http://127.0.0.1:5001/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token_amit_02'
    }
  }, syncEvent);
  assert(badSyncRes.statusCode === 403, `Sync rejected for student attempting to modify another student (HTTP 403)`);

  // -------------------------------------------------------------------------
  // TEST SUITE 3: Ed25519 Cryptographic Signing & Tamper Detection
  // -------------------------------------------------------------------------
  console.log('\n[Suite 3: Ed25519 Cryptographic Signing & Tamper Detection]');
  const credRes = await httpRequest('http://127.0.0.1:5001/api/credentials/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    studentId: 'priya_17',
    studentName: 'Priya Kumari',
    age: 17,
    courseId: 'SAMPLE-CRS-SOLAR-101',
    qualification: 'Solar Photovoltaic & DC Microgrid Inverter Technician (Level 1)',
    guardianConsentVerified: true
  });

  const originalCred = credRes.body;
  assert(credRes.statusCode === 201, `Credential issued successfully (HTTP 201, ID: ${originalCred.id})`);
  assert(originalCred.issuer.id === 'did:web:kamai-kaksha.example', `Issuer DID is did:web:kamai-kaksha.example`);
  assert(originalCred.issuer.issuerNote === 'Demo issuer, not a government credential', `Issuer note matches specification`);

  // Verify unmodified credential
  const validCheck = await httpRequest('http://127.0.0.1:5001/api/verify/check-payload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, originalCred);
  assert(validCheck.body?.verified === true, `Original Ed25519 signature verifies (verified: true)`);
  assert(validCheck.body?.signatureAlgorithm === 'Ed25519', `Signature algorithm verified as Ed25519`);

  // Tamper test 1: Modify qualification
  const tampered1 = JSON.parse(JSON.stringify(originalCred));
  tampered1.credentialSubject.qualification = 'Forged Qualification';
  const tamperCheck1 = await httpRequest('http://127.0.0.1:5001/api/verify/check-payload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, tampered1);
  assert(tamperCheck1.body?.verified === false, `Tamper qualification -> returns verified: false`);

  // Tamper test 2: Modify grade
  const tampered2 = JSON.parse(JSON.stringify(originalCred));
  tampered2.credentialSubject.grade = 'Distinction (100% Forged)';
  const tamperCheck2 = await httpRequest('http://127.0.0.1:5001/api/verify/check-payload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, tampered2);
  assert(tamperCheck2.body?.verified === false, `Tamper grade -> returns verified: false`);

  // -------------------------------------------------------------------------
  // TEST SUITE 4: Minor Consent Gate (HTTP 403)
  // -------------------------------------------------------------------------
  console.log('\n[Suite 4: Minor Consent Gate (HTTP 403 Rejection)]');
  const minorConsentRes = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    studentId: 'priya_17',
    guardianConsent: false,
    evidence: { multimeterVoltage: '12.6V' }
  });

  assert(minorConsentRes.statusCode === 403, `Submission without guardian consent returns HTTP 403 (Got ${minorConsentRes.statusCode})`);
  assert(minorConsentRes.body?.guardianConsentRequired === true, `Error payload confirms guardianConsentRequired: true`);

  // -------------------------------------------------------------------------
  // TEST SUITE 5: Micro-Task Engine Rate Limiter (HTTP 429)
  // -------------------------------------------------------------------------
  console.log('\n[Suite 5: Micro-Task Submission Rate Limiter (HTTP 429 Cooldown)]');
  // Wait 5.2s for any existing cooldown to lapse
  await sleep(5200);

  // First submission: should succeed
  const sub1 = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    studentId: 'priya_17',
    guardianConsent: true,
    evidence: { multimeterVoltage: '12.6V', notes: 'Checked grounding.' }
  });
  assert(sub1.statusCode === 200, `First submission accepted (HTTP 200)`);

  // Immediate second submission: should trigger 429 Rate Limit
  const sub2 = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    studentId: 'priya_17',
    guardianConsent: true
  });
  assert(sub2.statusCode === 429, `Rapid second submission rejected with HTTP 429 Rate Limit (Got ${sub2.statusCode})`);
  assert(sub2.body?.retryAfterSeconds > 0, `Payload contains retryAfterSeconds: ${sub2.body?.retryAfterSeconds}`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  } finally {
    if (spawnedServer) {
      try { spawnedServer.kill('SIGTERM'); } catch (e) {}
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test runner exception:', err);
  process.exit(1);
});
