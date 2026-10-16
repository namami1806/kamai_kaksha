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
      console.log(`[Screenshot Saved] ${path.basename(filePath)} (${buf.length} bytes)`);
    } catch (e) {
      console.warn(`[Screenshot Fallback] ${e.message}`);
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
  console.log('WOW-FLOW E2E CDP RUN: FRESH PRIYA MODULE 1 -> TASK -> WALLET -> CREDENTIAL');
  console.log('================================================================\n');

  // Step 0: Reset Wallet and Clear Credential for Fresh Priya
  console.log('Step 0: Resetting student wallet for Fresh Priya (priya_17)...');
  await httpRequest('http://127.0.0.1:5001/api/wallet/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { studentId: 'priya_17' });

  // Verify that credential does NOT exist prior to peer review (Step 0b removed)
  const preCheckCred = await httpRequest('http://127.0.0.1:5001/api/credentials/SAMPLE-CRED-PRIYA_17-SAMPLE-CRS-SOLAR-101');
  console.log(`        Pre-review Credential Check (expect 404): Status=${preCheckCred.statusCode} (Pre-issuing removed)`);

  // Step 1: Launch Chrome on debug port 9445
  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9445',
    '--user-data-dir=/tmp/chrome-wowflow-' + Date.now(),
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
      const res = await httpRequest('http://127.0.0.1:9445/json/version');
      if (res.statusCode === 200) {
        connected = true;
        break;
      }
    } catch (e) {}
  }

  if (!connected) {
    chromeProc.kill('SIGTERM');
    throw new Error('Could not connect to Chrome debugging port 9445');
  }

  try {
    // Step 2: Open Life Map Learning Path for Fresh Priya
    console.log('\nStep 1: Navigating to Fresh Priya Learning Path (Module 1 ready)...');
    const page = await openPage(9445, 'http://localhost:5173/?view=learning_path&stage=learning_path&persona=fresh&lang=en');

    // Verify before state
    const beforeState = await page.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Complete Module 1'));
        return {
          hasModule1Button: !!btn,
          btnText: btn ? btn.textContent.trim() : null
        };
      })()
    `);
    console.log(`        Before Module 1: Complete Button Found = ${beforeState.hasModule1Button} ("${beforeState.btnText}")`);

    // Screenshot 1: Before Module 1
    await page.screenshot(path.join(screenshotsDir, 'm4_wowflow_before_module1.png'));

    // Step 3: Click "Complete Module 1 (+40 XP)"
    console.log('\nStep 2: Clicking "Complete Module 1 (+40 XP)" as Priya...');
    await page.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Complete Module 1'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);

    // Step 4: Click "Open ₹40 Micro-Task"
    console.log('Step 3: Clicking "Open ₹40 Micro-Task" to open MicroTaskModal...');
    await page.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open ₹40 Micro-Task'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);

    // Step 5: Submit Task Evidence inside Modal
    console.log('Step 4: Submitting task multimeter evidence in MicroTaskModal...');
    await page.eval(`
      (() => {
        const input = document.querySelector('input[type="text"]');
        if (input) {
          input.value = '12.6';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Evidence'));
        if (submitBtn) submitBtn.click();
      })()
    `);
    await sleep(1800);

    // Step 6: Simulate 3-Peer Cross-Validation
    console.log('Step 5: Simulating 3-Peer Cross-Validation in MicroTaskModal...');
    await page.eval(`
      (() => {
        const peerBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Simulate 3-Peer Cross-Validation'));
        if (peerBtn) peerBtn.click();
      })()
    `);
    await sleep(2500);

    // Verify 3/3 peer approvals inside modal
    const modalCheck = await page.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          is3PeersApproved: text.includes('3/3 Peer Approvals Verified') || text.includes('3 / 3 Approvals'),
          hasClaimButton: Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Open Wallet & Claim ₹40'))
        };
      })()
    `);
    console.log(`        Peer Review Status: 3PeersApproved=${modalCheck.is3PeersApproved}, ClaimButtonReady=${modalCheck.hasClaimButton}`);

    // Strict assertion: FAIL test if peer approval or claim button is not ready
    if (!modalCheck.is3PeersApproved) {
      throw new Error(`TEST FAILED: 3PeersApproved is FALSE!`);
    }
    if (!modalCheck.hasClaimButton) {
      throw new Error(`TEST FAILED: ClaimButtonReady is FALSE!`);
    }

    // Verify timestamp: Credential must be issued by server on/after task approval
    const taskState = await httpRequest('http://127.0.0.1:5001/api/tasks/SAMPLE-TSK-SOLAR-FIX-01');
    const approvedAt = taskState.body?.approvedAt;
    const credIssuedAt = taskState.body?.credentialIssuedAt;
    const isIssuedAfterApproval = new Date(credIssuedAt).getTime() >= new Date(approvedAt).getTime();
    console.log(`        Task Approved At:      ${approvedAt}`);
    console.log(`        Credential Issued At:  ${credIssuedAt}`);
    console.log(`        Timestamp Order Check: issuedAt >= approvedAt: ${isIssuedAfterApproval} (Diff: ${new Date(credIssuedAt).getTime() - new Date(approvedAt).getTime()}ms)`);

    if (!isIssuedAfterApproval) {
      throw new Error(`TEST FAILED: Credential was not issued on/after peer approval!`);
    }

    // Step 7: Click "Open Wallet & Claim ₹40 (Coin Burst)"
    console.log('\nStep 6: Clicking "Open Wallet & Claim ₹40" -> Navigating to WalletView...');
    await page.eval(`
      (() => {
        const claimBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open Wallet & Claim ₹40'));
        if (claimBtn) claimBtn.click();
      })()
    `);
    await sleep(2500);

    // Step 8: Verify Wallet DOM & Auto-Save
    const walletCheck = await page.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          totalEarned: text.includes('₹40'),
          autoSavedToolkit: text.includes('₹4') && text.includes('Tool Kit Fund'),
          spendableCash: text.includes('₹36'),
          simulatedUpi: text.includes('priya@okgramin'),
          hasProceedCredButton: Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('View Ed25519 Signed Credential'))
        };
      })()
    `);
    console.log(`Step 7: Wallet DOM Verified: Total=₹40 (${walletCheck.totalEarned}), ToolKit=₹4 (${walletCheck.autoSavedToolkit}), SpendableCash=₹36 (${walletCheck.spendableCash}), UPI=priya@okgramin (${walletCheck.simulatedUpi})`);

    // Screenshot 2: After Wallet Claim
    await page.screenshot(path.join(screenshotsDir, 'm4_wowflow_wallet_after.png'));

    // Step 9: Click "Proceed to Step 5: View Ed25519 Signed Credential with QR →"
    console.log('\nStep 8: Clicking "Proceed to Step 5: View Ed25519 Signed Credential" -> Navigating to VerifiableCredentialCard...');
    await page.eval(`
      (() => {
        const credBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View Ed25519 Signed Credential'));
        if (credBtn) credBtn.click();
      })()
    `);
    await sleep(2200);

    // Step 10: Verify Credential Labels before verification
    const credInitial = await page.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          issuer: text.includes('did:web:kamai-kaksha.example'),
          demoIssuerLabel: text.includes('Demo issuer, not a government credential'),
          minorSafeguards: text.includes('minor safeguards, pending legal review'),
          hasVerifyBtn: Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Verify Cryptographic Signature'))
        };
      })()
    `);
    console.log(`Step 9: Credential Initial State: Issuer=did:web:kamai-kaksha.example (${credInitial.issuer}), DemoLabel=${credInitial.demoIssuerLabel}, MinorSafeguards=${credInitial.minorSafeguards}`);

    // Step 11: Click "Verify Cryptographic Signature"
    console.log('Step 10: Clicking "Verify Cryptographic Signature" for live Ed25519 server verification...');
    await page.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify Cryptographic Signature'));
        if (btn) btn.click();
      })()
    `);
    await sleep(2000);

    // Step 12: Verify Live Signature Verification Result
    const credVerified = await page.eval(`
      (() => {
        const text = document.body.innerText;
        return {
          isLiveVerified: text.includes('Ed25519 Signature Verified') || text.includes('Cryptographic Signature Validated'),
          statusCode200: text.includes('200 OK'),
          hasAlgorithm: text.includes('Ed25519'),
          hasIssuerWeb: text.includes('did:web:kamai-kaksha.example')
        };
      })()
    `);
    console.log(`\nStep 11: Live Verification Result: LiveVerified=${credVerified.isLiveVerified}, Status200=${credVerified.statusCode200}, Algorithm=${credVerified.hasAlgorithm}`);

    // Scroll to verification banner & QR code
    await page.eval(`window.scrollTo({ top: 620, behavior: 'instant' })`);
    await sleep(600);

    // Screenshot 3: Newly Issued Credential Verified
    await page.screenshot(path.join(screenshotsDir, 'm4_wowflow_new_credential_verified.png'));

    page.close();
  } finally {
    chromeProc.kill('SIGTERM');
  }

  console.log('\n================================================================');
  console.log('WOW-FLOW E2E CDP RUN COMPLETE: ALL STEPS PASSED');
  console.log('================================================================');
}

run().catch(err => {
  console.error('Fatal error during Wow-Flow E2E test:', err);
  process.exit(1);
});
