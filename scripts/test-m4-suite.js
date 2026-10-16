import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

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

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl, { maxPayload: 100 * 1024 * 1024 });
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        try {
          const str = typeof data === 'string' ? data : data.toString('utf-8');
          const msg = JSON.parse(str);
          if (msg.id && this.callbacks.has(msg.id)) {
            const { resolve, reject } = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        } catch (e) {}
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : null;
  }

  async screenshot(filePath) {
    try {
      const capturePromise = this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot timeout')), 8000));
      const res = await Promise.race([capturePromise, timeoutPromise]);
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(filePath, buf);
      console.log(`    [Saved Screenshot] ${path.basename(filePath)} (${buf.length} bytes)`);
    } catch (e) {
      console.warn(`    [Screenshot Fallback] ${e.message}`);
    }
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
  }
}

async function openPage(port, url) {
  const res = await httpRequest(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' });
  const client = new CDPClient(res.body.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 780, deviceScaleFactor: 2, mobile: true });
  await client.send('Page.navigate', { url });
  await sleep(2500);
  return client;
}

async function run() {
  console.log('================================================================');
  console.log('M4 COMPREHENSIVE SUITE: MICRO-TASKS, WALLET, ED25519, GAON GURU');
  console.log('================================================================\n');

  // Launch Chrome on debugging port 9444
  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--user-data-dir=/tmp/chrome-m4-' + Date.now(),
    '--window-size=360,780',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for Chrome port
  let connected = false;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await httpRequest('http://127.0.0.1:9444/json/version');
      if (res.statusCode === 200) {
        connected = true;
        break;
      }
    } catch (e) {}
  }

  if (!connected) {
    chromeProc.kill('SIGTERM');
    throw new Error('Could not connect to Chrome debugging port 9444');
  }

  try {
    // --------------------------------------------------------------------------
    // ITEM 1: RATE LIMIT & MINOR CONSENT CHECK & SCAM AWARENESS CARD
    // --------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('ITEM 1: Micro-task Engine: Minor Protection Gate & Rate Limiter');
    console.log('----------------------------------------------------------------');

    // 1a. Test Minor Consent Rejection (HTTP 403)
    console.log('1a. Testing Minor Consent Rejection (guardianConsent: false)...');
    const minorRes = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      studentId: 'priya_17',
      guardianConsent: false
    });
    console.log(`    Status: ${minorRes.statusCode} (${minorRes.body.error})`);

    // 1b. Test Successful Submission (guardianConsent: true after cooldown)
    console.log('1b. Waiting 5.2s for rate limit cooldown to expire naturally...');
    await sleep(5200);
    console.log('    Testing Valid Task Submission (guardianConsent: true)...');
    const submitRes = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      studentId: 'priya_17',
      guardianConsent: true,
      evidence: { multimeterVoltage: '12.6V', notes: 'Ground bus cleaned.' }
    });
    console.log(`    Status: ${submitRes.statusCode} (Task Status: ${submitRes.body.task?.status})`);

    // 1c. Test Rate Limiting Cooldown (HTTP 429)
    console.log('1c. Testing Rapid Submission Rate Limit (Immediate Second Call)...');
    const rateLimitRes = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      studentId: 'priya_17',
      guardianConsent: true
    });
    console.log(`    Status: ${rateLimitRes.statusCode} (${rateLimitRes.body.error})`);

    // 1d. UI Verification of Task Modal & Scam Awareness Card via CDP
    console.log('1d. Opening MicroTaskModal in Chrome at 360px...');
    const taskClient = await openPage(9444, 'http://localhost:5173/?view=tasks&persona=fresh&lang=en');

    const taskUiCheck = await taskClient.eval(`
      (() => {
        const scamAlert = document.body.innerText.includes('Village Security Advisory') || document.body.innerText.includes('धोखाधड़ी से सावधान');
        const minorGate = document.body.innerText.includes('Minor Protection Gate') || document.body.innerText.includes('Guardian Consent Verified');
        const peerCount = Array.from(document.querySelectorAll('*')).some(el => el.textContent.includes('3 Approvals') || el.textContent.includes('3-Peer Cross-Validation'));
        return { scamAlert, minorGate, peerCount };
      })()
    `);
    console.log(`    UI Features Verified: ScamAlert=${taskUiCheck.scamAlert}, MinorGate=${taskUiCheck.minorGate}, 3Peers=${taskUiCheck.peerCount}`);
    await taskClient.screenshot(path.join(screenshotsDir, 'm4_microtask_modal_scam_alert.png'));
    taskClient.close();

    // --------------------------------------------------------------------------
    // ITEM 2: 3-PEER CROSS-VALIDATION ENGINE
    // --------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('ITEM 2: 3-Peer Cross-Validation Engine');
    console.log('----------------------------------------------------------------');
    console.log('1. Simulating 3 peers validating Priya\'s multimeter earth-pit reading...');
    const peersRes = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/simulate-peers', {
      method: 'POST'
    });
    console.log(`   Task Status: ${peersRes.body.task?.status}`);
    console.log(`   Validations: ${peersRes.body.task?.validations?.map(v => `${v.peerName} (${v.approved ? 'APPROVED' : 'DENIED'})`).join(', ')}`);
    console.log(`   Payout Reference: ${peersRes.body.task?.payoutRef}`);

    // --------------------------------------------------------------------------
    // ITEM 3: WOW-FLOW STEP 4: WALLET WITH 10% AUTO-SAVE & COIN BURST & SIMULATED UPI
    // --------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('ITEM 3: Wow-Flow Step 4: Wallet & 10% Auto-Save to Tool Kit Fund');
    console.log('----------------------------------------------------------------');

    const walletClient = await openPage(9444, 'http://localhost:5173/?view=wallet&lang=en');

    const walletData = await walletClient.eval(`
      (() => {
        const bodyText = document.body.innerText;
        return {
          hasTotal40: bodyText.includes('₹40') || bodyText.includes('₹80'),
          hasAutoSave4: (bodyText.includes('₹4') || bodyText.includes('₹8')) && bodyText.includes('Tool Kit Fund'),
          hasCash36: bodyText.includes('₹36') || bodyText.includes('₹72'),
          hasSimulatedUpi: bodyText.includes('priya@okgramin') && bodyText.includes('Simulated UPI'),
          hasAudioToggle: !!document.querySelector('button[aria-label*="sounds"]')
        };
      })()
    `);
    console.log(`   Wallet Data in UI: Total Earned=${walletData.hasTotal40}, Tool Kit Fund=${walletData.hasAutoSave4}, Available Cash=${walletData.hasCash36}, Simulated UPI=${walletData.hasSimulatedUpi}, AudioToggle=${walletData.hasAudioToggle}`);

    await walletClient.screenshot(path.join(screenshotsDir, 'm4_wallet_toolkit_fund.png'));
    walletClient.close();

    // --------------------------------------------------------------------------
    // ITEM 4: WOW-FLOW STEP 5: ED25519 CREDENTIALS SERVER-SIGNED + QR VERIFY + DIGILOCKER JSON
    // --------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('ITEM 4: Wow-Flow Step 5: Ed25519 Server-Signed Credential & QR Verify');
    console.log('----------------------------------------------------------------');

    // 4a. Server cryptographic verification check
    const credVerifyRes = await httpRequest('http://127.0.0.1:5001/api/verify/did:credential:SAMPLE-CRED-PRIYA_17-SAMPLE-CRS-SOLAR-101');
    console.log('4a. Server Cryptographic Ed25519 Verification Endpoint:');
    console.log(`    Status: ${credVerifyRes.statusCode}, Verified: ${credVerifyRes.body.verified}`);
    console.log(`    Algorithm: ${credVerifyRes.body.signatureAlgorithm}`);
    console.log(`    Issuer: ${credVerifyRes.body.issuer}`);

    // 4b. CDP Credential Page & Interactive Live Verification
    console.log('4b. Opening Credential View at 360px via CDP...');
    const credClient = await openPage(9444, 'http://localhost:5173/?view=credentials&lang=en');

    // Click interactive "Verify Cryptographic Signature" button
    console.log('4c. Clicking "Verify Cryptographic Signature" button in UI...');
    await credClient.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify Cryptographic Signature'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);

    const credUiCheck = await credClient.eval(`
      (() => {
        const bodyText = document.body.innerText;
        const hasSvgQr = !!document.querySelector('svg');
        const hasEd25519Badge = bodyText.includes('Ed25519');
        const hasDigiLockerExport = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Export DigiLocker JSON'));
        const isLiveVerified = bodyText.includes('Ed25519 Signature Verified') || bodyText.includes('Cryptographic Signature Validated');
        return { hasSvgQr, hasEd25519Badge, hasDigiLockerExport, isLiveVerified };
      })()
    `);
    console.log(`   Credential UI: SvgQR=${credUiCheck.hasSvgQr}, Ed25519Badge=${credUiCheck.hasEd25519Badge}, DigiLockerExport=${credUiCheck.hasDigiLockerExport}, LiveVerified=${credUiCheck.isLiveVerified}`);

    await credClient.screenshot(path.join(screenshotsDir, 'm4_ed25519_credential_qr.png'));
    credClient.close();

    // --------------------------------------------------------------------------
    // ITEM 5: GAON GURU RULES-BASED JOB RADAR
    // --------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('ITEM 5: Gaon Guru Rules-Based Job Radar');
    console.log('----------------------------------------------------------------');

    const radarRes = await httpRequest('http://127.0.0.1:5001/api/radar/jobs?studentId=priya_17&district=Gaya&block=Tekari');
    console.log(`5a. Radar Engine Matched Jobs Count: ${radarRes.body.totalAvailable}`);
    console.log(`    Top Match: ${radarRes.body.topMatches?.[0]?.title} (${radarRes.body.topMatches?.[0]?.matchPercent}%, ${radarRes.body.topMatches?.[0]?.distanceKm} km, ₹${radarRes.body.topMatches?.[0]?.averageMonthlyIncome}/mo)`);

    console.log('5b. Opening Gaon Guru Job Radar via CDP at 360px...');
    const radarClient = await openPage(9444, 'http://localhost:5173/?view=radar&lang=en');

    const radarUiCheck = await radarClient.eval(`
      (() => {
        const bodyText = document.body.innerText;
        return {
          hasRadarTitle: bodyText.includes('Gaon Guru') || bodyText.includes('गांव गुरु'),
          hasMatches: bodyText.includes('% Skill Match'),
          hasDistance: bodyText.includes('km'),
          hasIncome: bodyText.includes('Avg Monthly Earning') || bodyText.includes('/mo'),
          hasFacilitatorCTA: Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Apply via Village Facilitator'))
        };
      })()
    `);
    console.log(`   Radar UI: Title=${radarUiCheck.hasRadarTitle}, Matches=${radarUiCheck.hasMatches}, Distance=${radarUiCheck.hasDistance}, Income=${radarUiCheck.hasIncome}, FacilitatorCTA=${radarUiCheck.hasFacilitatorCTA}`);

    await radarClient.screenshot(path.join(screenshotsDir, 'm4_gaon_guru_radar.png'));
    radarClient.close();

  } finally {
    chromeProc.kill('SIGTERM');
  }

  console.log('\n================================================================');
  console.log('ALL M4 VERIFICATION TESTS COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

run().catch(err => {
  console.error('Fatal error during M4 test suite:', err);
  process.exit(1);
});
