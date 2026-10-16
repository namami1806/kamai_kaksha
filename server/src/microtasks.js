import { issueVerifiableCredential, removeCredential } from './crypto-credentials.js';

// In-memory tasks database
const tasksStore = new Map([
  [
    'SAMPLE-TSK-SOLAR-FIX-01',
    {
      id: 'SAMPLE-TSK-SOLAR-FIX-01',
      title: 'Gram Panchayat Solar Inverter Grounding & Multimeter Check',
      category: 'Clean Energy Microgrid',
      village: 'Tekari Block, Gaya District',
      rewardTotal: 40,
      autoSavePercent: 10, // 10% = ₹4
      autoSaveFundName: 'Tool Kit Fund',
      minAge: 16,
      requiresMinorGuardianConsent: true,
      description: 'Perform earth-pit terminal resistance check on 1kW solar hybrid inverter at Gram Panchayat Bhawan.',
      requiredSkills: ['DC Inverter Wiring', 'Multimeter Diagnostics'],
      targetValidations: 3,
      status: 'AVAILABLE', // AVAILABLE | PENDING_PEER_VALIDATION | VERIFIED | PAID
      submission: null,
      validations: [],
      payoutRef: null,
      disclaimer: 'Sample micro-task modelled on PM Surya Ghar village maintenance'
    }
  ]
]);

// In-memory wallet store
const walletsStore = new Map([
  [
    'priya_17',
    {
      studentId: 'priya_17',
      studentName: 'Priya Kumari',
      age: 17,
      isMinor: true,
      guardianConsent: true,
      availableBalance: 0,
      toolKitFund: 0,
      totalEarned: 0,
      transactions: [],
      simulatedUpiId: 'priya@okgramin',
      disclaimer: 'Simulated UPI • Demo Only • No Real Money Moved'
    }
  ]
]);

// Rate limiter store: Map of studentId -> timestamps of recent submissions
const rateLimitStore = new Map();
const COOLDOWN_SECONDS = 5;

/**
 * Check rate limit for student
 */
export function checkRateLimit(studentId) {
  const now = Date.now();
  const history = rateLimitStore.get(studentId) || [];
  
  // Filter history to last 60 seconds
  const recent = history.filter(ts => (now - ts) < 60000);
  rateLimitStore.set(studentId, recent);

  // Check minimum gap between submissions (cooldown)
  if (recent.length > 0) {
    const lastTimestamp = recent[recent.length - 1];
    const diffSeconds = (now - lastTimestamp) / 1000;
    if (diffSeconds < COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(COOLDOWN_SECONDS - diffSeconds);
      return {
        allowed: false,
        error: `Rate limit active: Please wait ${waitTime}s before submitting again (anti-spam protection).`,
        retryAfterSeconds: waitTime
      };
    }
  }

  // Record this attempt
  recent.push(now);
  rateLimitStore.set(studentId, recent);
  return { allowed: true };
}

/**
 * Submit task evidence with Minor Protection Check & Rate Limiting
 */
export function submitTaskEvidence({
  taskId = 'SAMPLE-TSK-SOLAR-FIX-01',
  studentId = 'priya_17',
  evidence = { multimeterVoltage: '12.6V', notes: 'Inverter earth-pit terminal cleaned and tightened.' },
  guardianConsent = true
}) {
  const task = tasksStore.get(taskId);
  if (!task) {
    return { success: false, error: 'Task not found in registry', statusCode: 404 };
  }

  // 1. Rate Limiting Check
  const rateLimit = checkRateLimit(studentId);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: rateLimit.error,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      statusCode: 429
    };
  }

  // 2. Minor Protection & Consent Check
  let wallet = walletsStore.get(studentId);
  const isMinor = wallet ? wallet.isMinor : true;
  const hasConsent = guardianConsent === true || (guardianConsent === undefined && wallet && wallet.guardianConsent);

  if (isMinor && !hasConsent) {
    return {
      success: false,
      error: 'DPDP Minor Protection: Guardian consent verification required before micro-task submission.',
      guardianConsentRequired: true,
      statusCode: 403
    };
  }

  // Record submission
  task.submission = {
    studentId,
    evidence,
    submittedAt: new Date().toISOString(),
    guardianConsentVerified: true
  };
  task.status = 'PENDING_PEER_VALIDATION';
  task.validations = [];

  return {
    success: true,
    task,
    message: 'Task submitted successfully. Awaiting 3-peer cross-validation.',
    statusCode: 200
  };
}

/**
 * Record a peer review validation (3-peer cross-validation)
 */
export function validateTaskByPeer({
  taskId = 'SAMPLE-TSK-SOLAR-FIX-01',
  peerId,
  peerName,
  peerVillage,
  approved = true,
  checklist = ['multimeter_verified', 'grounding_photo_inspected']
}) {
  const task = tasksStore.get(taskId);
  if (!task) return { success: false, error: 'Task not found' };

  if (task.status !== 'PENDING_PEER_VALIDATION' && task.status !== 'AVAILABLE') {
    // Already verified or paid
    return { success: true, task, status: task.status };
  }

  // Prevent duplicate review from same peer
  const existing = task.validations.find(v => v.peerId === peerId);
  if (existing) {
    existing.approved = approved;
    existing.timestamp = new Date().toISOString();
  } else {
    task.validations.push({
      peerId,
      peerName,
      peerVillage,
      approved,
      checklist,
      timestamp: new Date().toISOString()
    });
  }

  // Check if target cross-validations (3 approvals) achieved
  const approvedCount = task.validations.filter(v => v.approved).length;
  if (approvedCount >= (task.targetValidations || 3)) {
    task.status = 'VERIFIED';
    task.approvedAt = new Date().toISOString();

    // Trigger automated 10% auto-save wallet payout
    const payoutResult = triggerWalletPayout({
      studentId: task.submission?.studentId || 'priya_17',
      taskId: task.id,
      amount: task.rewardTotal
    });
    task.payoutRef = payoutResult.transaction.id;

    // Issue Server-Side Ed25519 Verifiable Credential upon 3-peer cross validation
    const issuedCred = issueVerifiableCredential({
      studentId: task.submission?.studentId || 'priya_17',
      studentName: 'Priya Kumari',
      age: 17,
      district: 'Gaya',
      state: 'Bihar',
      courseId: 'SAMPLE-CRS-SOLAR-101',
      qualification: 'Solar Photovoltaic & DC Microgrid Inverter Technician (Level 1)',
      guardianConsentVerified: true
    });
    task.credentialId = issuedCred.id;
    task.credentialIssuedAt = issuedCred.issuanceDate;
  }

  return {
    success: true,
    task,
    approvedCount,
    isFullyVerified: task.status === 'VERIFIED'
  };
}

/**
 * Auto-simulate 3-peer cross-validation for instant interactive demo
 */
export function simulateThreePeerValidations(taskId = 'SAMPLE-TSK-SOLAR-FIX-01') {
  const peers = [
    { peerId: 'peer_rahul_02', peerName: 'Rahul Kumar', peerVillage: 'Tekari (Solar Batchmate)' },
    { peerId: 'peer_meera_03', peerName: 'Meera Devi', peerVillage: 'Bodh Gaya (Certified Tech)' },
    { peerId: 'peer_amit_04', peerName: 'Amit Sharma', peerVillage: 'Gaya Hub (Senior Peer)' }
  ];

  const results = [];
  for (const peer of peers) {
    const res = validateTaskByPeer({
      taskId,
      peerId: peer.peerId,
      peerName: peer.peerName,
      peerVillage: peer.peerVillage,
      approved: true
    });
    results.push(res);
  }

  return getTask(taskId);
}

/**
 * Payout Engine: 10% Auto-Save to Tool Kit Fund + 90% Available Cash
 */
export function triggerWalletPayout({ studentId = 'priya_17', taskId = 'SAMPLE-TSK-SOLAR-FIX-01', amount = 40 }) {
  let wallet = walletsStore.get(studentId);
  if (!wallet) {
    wallet = {
      studentId,
      studentName: 'Priya Kumari',
      age: 17,
      isMinor: true,
      guardianConsent: true,
      availableBalance: 0,
      toolKitFund: 0,
      totalEarned: 0,
      transactions: [],
      simulatedUpiId: 'priya@okgramin',
      disclaimer: 'Simulated UPI • Demo Only • No Real Money Moved'
    };
    walletsStore.set(studentId, wallet);
  }

  // 10% Auto-save calculation
  const autoSavedAmount = Math.round(amount * 0.10); // ₹4 on ₹40
  const netCashAmount = amount - autoSavedAmount;    // ₹36 on ₹40

  wallet.availableBalance += netCashAmount;
  wallet.toolKitFund += autoSavedAmount;
  wallet.totalEarned += amount;

  const transaction = {
    id: `TXN_SIM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    taskId,
    amountTotal: amount,
    netCash: netCashAmount,
    autoSaved: autoSavedAmount,
    fundName: 'Tool Kit Fund (10% Auto-Save)',
    simulatedUpiRef: `UPI-MOCK-${Date.now().toString().slice(-6)}`,
    simulatedVpa: wallet.simulatedUpiId,
    timestamp: new Date().toISOString(),
    status: 'COMPLETED_SIMULATED',
    disclaimer: 'Simulated UPI • Demo Only • No Real Money Moved'
  };

  wallet.transactions.unshift(transaction);

  const task = tasksStore.get(taskId);
  if (task) {
    task.status = 'PAID';
    task.payoutRef = transaction.id;
  }

  return { wallet, transaction };
}

export function getTask(taskId) {
  return tasksStore.get(taskId) || null;
}

export function getAllTasks() {
  return Array.from(tasksStore.values());
}

export function getWallet(studentId = 'priya_17') {
  return walletsStore.get(studentId) || null;
}

export function resetWallet(studentId = 'priya_17') {
  walletsStore.set(studentId, {
    studentId,
    studentName: 'Priya Kumari',
    age: 17,
    isMinor: true,
    guardianConsent: true,
    availableBalance: 0,
    toolKitFund: 0,
    totalEarned: 0,
    transactions: [],
    simulatedUpiId: 'priya@okgramin',
    disclaimer: 'Simulated UPI • Demo Only • No Real Money Moved'
  });
  const task = tasksStore.get('SAMPLE-TSK-SOLAR-FIX-01');
  if (task) {
    task.status = 'AVAILABLE';
    task.submission = null;
    task.validations = [];
    task.payoutRef = null;
    task.approvedAt = null;
    task.credentialId = null;
    task.credentialIssuedAt = null;
  }
  removeCredential(`SAMPLE-CRED-${studentId.toUpperCase()}-SAMPLE-CRS-SOLAR-101`);
}
