import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { requireStudentOrFacilitator, requireFacilitatorOnly } from './auth.js';
import { setupMQTTBroker } from './mqtt.js';
import { 
  issueVerifiableCredential, 
  verifyCredentialById, 
  verifyCredentialPayload,
  getPublicKeyInfo, 
  getCredential 
} from './crypto-credentials.js';
import {
  getTask,
  getAllTasks,
  submitTaskEvidence,
  validateTaskByPeer,
  simulateThreePeerValidations,
  getWallet,
  resetWallet
} from './microtasks.js';
import { getMatchedJobs } from './jobradar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || origin === clientOrigin || origin === 'http://127.0.0.1:5173' || origin === 'http://localhost:5173') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return next();
  }
  return res.status(403).json({
    error: 'CORS forbidden: Origin not allowed',
    origin,
    allowedOrigin: clientOrigin
  });
});
app.use(express.json({ limit: '10mb' }));

// In-memory sync events log
const syncedEvents = [];

// Initialize MQTT broker attached to HTTP server
const mqttManager = setupMQTTBroker(httpServer);

// Load Grounded Knowledge Base
const kbPath = path.resolve(__dirname, '../../data/knowledge_base.json');
let knowledgeBase = { courses: [], apprenticeships: [], local_jobs: [] };
try {
  if (fs.existsSync(kbPath)) {
    knowledgeBase = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
  }
} catch (err) {
  console.error('Error reading knowledge base:', err);
}

// Load Seed Data Helper (12 Students)
const seedPath = path.resolve(__dirname, '../../data/seed_students.json');
function getSeedStudents() {
  try {
    if (fs.existsSync(seedPath)) {
      return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading seed students:', err);
  }
  return [];
}

// Health Check
app.get('/api/health', (req, res) => {
  const seedStudents = getSeedStudents();
  res.json({
    status: 'ok',
    service: 'kamai-kaksha-server',
    timestamp: new Date().toISOString(),
    mqttBroker: 'active (WebSockets on /mqtt)',
    totalStudentsSeeded: seedStudents.length
  });
});

/**
 * Real Sync Endpoint (Protected with Per-Student Token Auth - Requirement 8)
 * Validates token and acknowledges queued events with idempotency check.
 */
app.post('/api/sync', requireStudentOrFacilitator, (req, res) => {
  const event = req.body;
  if (!event || !event.id) {
    return res.status(400).json({ error: 'Invalid event format. id is required.' });
  }

  // Record received event with idempotency check
  const existing = syncedEvents.find(e => e.id === event.id);
  if (!existing) {
    syncedEvents.push({
      ...event,
      serverReceivedAt: new Date().toISOString()
    });

    // Publish progress event via MQTT telemetry stream (QoS 1)
    mqttManager.publishTelemetryEvent(event.studentId, {
      eventType: event.eventType,
      itemId: event.itemId,
      payload: event.payload
    });
  }

  return res.status(200).json({
    status: 'acknowledged',
    eventId: event.id,
    studentId: event.studentId,
    serverReceivedAt: new Date().toISOString(),
    totalSynced: syncedEvents.length
  });
});

/**
 * Delta Cache Endpoint (Protected with Per-Student Token Auth - Requirement 8)
 * Returns next 3 courses + 5 local jobs with HTTP cache headers for offline caching.
 */
app.get('/api/delta', requireStudentOrFacilitator, (req, res) => {
  const studentId = req.query.studentId || req.auth?.studentId || 'priya_17';

  // Recommend courses based on knowledge base
  const predictedCourses = (knowledgeBase.courses || []).slice(0, 3);
  const localJobs = (knowledgeBase.local_jobs || []).slice(0, 5);

  // Set HTTP caching headers (private cache TTL for student delta)
  res.setHeader('Cache-Control', 'private, max-age=86400');

  res.json({
    studentId,
    timestamp: new Date().toISOString(),
    predictedCourses,
    localJobs,
    cachedUntil: new Date(Date.now() + 86400000).toISOString(),
    disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
  });
});

/**
 * Facilitator Metrics Endpoint (Requirement 9)
 * Computed dynamically from seed_students.json
 */
app.get('/api/facilitator/metrics', requireFacilitatorOnly, (req, res) => {
  const seedStudents = getSeedStudents();
  const totalStudents = seedStudents.length;
  const minors = seedStudents.filter(s => s.is_minor).length;
  const withFirstEarning = seedStudents.filter(s => s.has_completed_first_earning).length;
  const activeLast7Days = seedStudents.filter(s => s.last_active_days_ago <= 7).length;
  const totalEarnings = seedStudents.reduce((acc, s) => acc + (s.total_earnings || 0), 0);
  const totalAutoSaved = seedStudents.reduce((acc, s) => acc + (s.auto_saved_amount || 0), 0);
  const triageCount = seedStudents.filter(s => s.triage_needed || s.confidence_score < 0.60).length;

  const firstEarningRate = totalStudents > 0 ? parseFloat(((withFirstEarning / totalStudents) * 100).toFixed(1)) : 0;
  const weeklyRetentionRate = totalStudents > 0 ? parseFloat(((activeLast7Days / totalStudents) * 100).toFixed(1)) : 0;

  res.json({
    cohort: 'Gaya District Pilot (Tekari & Bodh Gaya Blocks)',
    totalStudents,
    minorsCount: minors,
    firstEarningCount: withFirstEarning,
    firstEarningRate, // 41.7%
    activeLearnersCount: activeLast7Days,
    weeklyRetentionRate, // 58.3%
    totalEarningsGenerated: totalEarnings,
    totalAutoSavedPool: totalAutoSaved,
    triageQueueCount: triageCount,
    disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC',
    computedAt: new Date().toISOString()
  });
});

/**
 * Facilitator Student Cohort List
 */
app.get('/api/facilitator/students', requireFacilitatorOnly, (req, res) => {
  const seedStudents = getSeedStudents();
  res.json({
    students: seedStudents,
    total: seedStudents.length,
    disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
  });
});

/**
 * Facilitator Triage Queue Endpoint
 */
app.get('/api/facilitator/triage', requireFacilitatorOnly, (req, res) => {
  const seedStudents = getSeedStudents();
  const triageStudents = seedStudents.filter(s => s.triage_needed || s.confidence_score < 0.60);
  res.json({
    triageList: triageStudents,
    count: triageStudents.length,
    reason: 'Confidence score below 0.60 safeguard threshold',
    disclaimer: 'Sample data modelled on DIKSHA/SWAYAM/NSDC'
  });
});

app.post('/api/test/reset-telemetry', (req, res) => {
  syncedEvents.length = 0;
  res.json({ status: 'cleared' });
});

/**
 * Recent Telemetry Feed (Live Stream Buffer)
 */
app.get('/api/telemetry/recent', (req, res) => {
  res.json({
    events: syncedEvents.slice(-20),
    count: syncedEvents.length,
    mqttTopic: 'kk/students/+/progress'
  });
});

/**
 * Public Credential Verification Endpoint (Ed25519 Cryptographic Verification)
 */
app.get('/api/verify/:credentialId', (req, res) => {
  const { credentialId } = req.params;
  const result = verifyCredentialById(credentialId);
  if (!result.verified && result.error === 'Credential not found in registry') {
    return res.status(404).json(result);
  }
  return res.json(result);
});

/**
 * Verify Arbitrary Credential Payload (Tamper Verification Endpoint)
 */
app.post('/api/verify/check-payload', (req, res) => {
  const result = verifyCredentialPayload(req.body);
  return res.json(result);
});

/**
 * Public Key Information Endpoint (Ed25519)
 */
app.get('/api/credentials/public-key', (req, res) => {
  res.json(getPublicKeyInfo());
});

/**
 * Verifiable Credential Retrieval (W3C / DigiLocker JSON)
 */
app.get('/api/credentials/:credentialId', (req, res) => {
  const { credentialId } = req.params;
  const cred = getCredential(credentialId);
  if (!cred) {
    return res.status(404).json({ error: 'Credential not found', credentialId });
  }
  return res.json(cred);
});

/**
 * Issue Verifiable Credential (Server-side Ed25519 Signed)
 */
app.post('/api/credentials/issue', (req, res) => {
  const cred = issueVerifiableCredential(req.body);
  return res.status(201).json(cred);
});

/**
 * Micro-task Registry & Details
 */
app.get('/api/tasks', (req, res) => {
  res.json({
    tasks: getAllTasks(),
    disclaimer: 'Sample micro-tasks modelled on PM Surya Ghar village maintenance'
  });
});

app.get('/api/tasks/:taskId', (req, res) => {
  const task = getTask(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

/**
 * Micro-task Evidence Submission (Rate Limited + Minor Consent Check)
 */
app.post('/api/tasks/:taskId/submit', (req, res) => {
  const { studentId, evidence, guardianConsent } = req.body;
  const result = submitTaskEvidence({
    taskId: req.params.taskId,
    studentId: studentId || 'priya_17',
    evidence,
    guardianConsent
  });

  if (!result.success) {
    return res.status(result.statusCode || 400).json(result);
  }

  // Publish to MQTT feed for facilitator monitoring
  mqttManager.publishTelemetryEvent(studentId || 'priya_17', {
    eventType: 'TASK_EVIDENCE_SUBMITTED',
    itemId: req.params.taskId,
    payload: { status: 'PENDING_PEER_VALIDATION' }
  });

  return res.status(200).json(result);
});

/**
 * Record Peer Validation (3-Peer Cross-Validation)
 */
app.post('/api/tasks/:taskId/validate', (req, res) => {
  const { peerId, peerName, peerVillage, approved, checklist } = req.body;
  const result = validateTaskByPeer({
    taskId: req.params.taskId,
    peerId,
    peerName,
    peerVillage,
    approved,
    checklist
  });

  return res.json(result);
});

/**
 * Auto-Simulate 3-Peer Cross-Validation
 */
app.post('/api/tasks/:taskId/simulate-peers', (req, res) => {
  const updatedTask = simulateThreePeerValidations(req.params.taskId);
  
  // Publish to MQTT feed
  mqttManager.publishTelemetryEvent(updatedTask.submission?.studentId || 'priya_17', {
    eventType: 'TASK_PEER_CROSS_VALIDATED',
    itemId: req.params.taskId,
    payload: { 
      status: 'VERIFIED',
      validationsCount: 3,
      payoutTriggered: true,
      amount: 40,
      autoSaved: 4,
      netCash: 36
    }
  });

  return res.json({
    success: true,
    task: updatedTask,
    message: '3-peer cross-validation successfully achieved. Payout triggered.'
  });
});

/**
 * Student Wallet & Tool Kit Fund (10% Auto-Save)
 */
app.get('/api/wallet/:studentId', (req, res) => {
  const wallet = getWallet(req.params.studentId || 'priya_17');
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  res.json(wallet);
});

app.post('/api/wallet/reset', (req, res) => {
  resetWallet(req.body.studentId || 'priya_17');
  res.json({ status: 'reset', studentId: req.body.studentId || 'priya_17' });
});

/**
 * Gaon Guru Job Radar (Rules-Based Matcher)
 */
app.get('/api/radar/jobs', (req, res) => {
  const { studentId, district, block, skills } = req.query;
  const skillsList = skills ? (Array.isArray(skills) ? skills : skills.split(',')) : undefined;
  const radar = getMatchedJobs({
    studentId: studentId || 'priya_17',
    district: district || 'Gaya',
    block: block || 'Tekari',
    skills: skillsList
  });
  res.json(radar);
});

httpServer.listen(PORT, () => {
  console.log(`[Kamai Server] Listening on http://localhost:${PORT}`);
});
