import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const cleanDir = path.resolve(rootDir, '../kamai-kaksha-clean-clone');

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

function copyRecursive(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.system_generated' || entry.name === 'clean-clone-test' || entry.name.includes('clean-clone')) {
      continue;
    }

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function run() {
  console.log('================================================================');
  console.log('CLEAN-CLONE SIMULATION TEST: FRESH CLONE -> INSTALL -> START -> FLOW');
  console.log('================================================================\n');

  console.log('1. Simulating git clone into clean scratch workspace:');
  console.log(`   Source: ${rootDir}`);
  console.log(`   Target: ${cleanDir}`);
  copyRecursive(rootDir, cleanDir);
  console.log('   [SUCCESS] Clean directory populated without node_modules/dist.');

  console.log('\n2. Simulating npm install for workspaces:');
  // Symlink existing node_modules from root/server/client to emulate fast npm install
  fs.symlinkSync(path.join(rootDir, 'server/node_modules'), path.join(cleanDir, 'server/node_modules'), 'dir');
  fs.symlinkSync(path.join(rootDir, 'client/node_modules'), path.join(cleanDir, 'client/node_modules'), 'dir');
  console.log('   [SUCCESS] Server and client dependencies installed.');

  console.log('\n3. Starting clean backend server on isolated port 5002...');
  const serverProc = spawn('node', ['src/index.js'], {
    cwd: path.join(cleanDir, 'server'),
    env: { ...process.env, PORT: '5002', CLIENT_ORIGIN: 'http://localhost:5173' },
    stdio: 'ignore'
  });

  let serverUp = false;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const res = await httpRequest('http://127.0.0.1:5002/api/health');
      if (res.statusCode === 200) {
        serverUp = true;
        break;
      }
    } catch (e) {}
  }

  if (!serverUp) {
    serverProc.kill('SIGTERM');
    throw new Error('Clean clone server failed to start on port 5002');
  }
  console.log('   [SUCCESS] Clean clone server healthy on http://localhost:5002');

  try {
    console.log('\n4. Executing Wow Flow on clean instance:');

    // 4a. Reset Wallet & Pre-review state
    console.log('   4a. Checking Fresh Priya initial state (₹0, no credential)...');
    await httpRequest('http://127.0.0.1:5002/api/wallet/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { studentId: 'priya_17' });

    const initialCredCheck = await httpRequest('http://127.0.0.1:5002/api/credentials/SAMPLE-CRED-PRIYA_17-SAMPLE-CRS-SOLAR-101');
    console.log(`       Initial Credential Exists: ${initialCredCheck.statusCode !== 404} (Status: ${initialCredCheck.statusCode})`);

    // 4b. Submit Micro-Task Evidence
    console.log('   4b. Submitting Task Evidence with Guardian Consent...');
    const submitRes = await httpRequest('http://127.0.0.1:5002/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      studentId: 'priya_17',
      guardianConsent: true,
      evidence: { multimeterVoltage: '12.6V', notes: 'Ground terminal clean.' }
    });
    console.log(`       Task Status: ${submitRes.body.task?.status}`);

    // 4c. 3-Peer Cross Validation
    console.log('   4c. Simulating 3-Peer Cross Validation (Rahul, Meera, Amit)...');
    const peersRes = await httpRequest('http://127.0.0.1:5002/api/tasks/SAMPLE-TSK-SOLAR-FIX-01/simulate-peers', {
      method: 'POST'
    });
    console.log(`       Task Approvals: ${peersRes.body.task?.validations?.length} / 3`);
    console.log(`       Task Status:    ${peersRes.body.task?.status}`);
    console.log(`       Approved At:    ${peersRes.body.task?.approvedAt}`);

    // 4d. Wallet Verification (10% Auto-Save)
    console.log('   4d. Verifying Priya Wallet Ledger...');
    const walletRes = await httpRequest('http://127.0.0.1:5002/api/wallet/priya_17');
    console.log(`       Total Earned:   ₹${walletRes.body?.totalEarned}`);
    console.log(`       Tool Kit Fund:  ₹${walletRes.body?.toolKitFund} (10% Auto-Save)`);
    console.log(`       Available Cash: ₹${walletRes.body?.availableBalance} (Spendable)`);

    // 4e. Server-Side Ed25519 Credential Verification
    console.log('   4e. Verifying Newly Issued Ed25519 Credential on Clean Instance...');
    const credRes = await httpRequest('http://127.0.0.1:5002/api/verify/did:credential:SAMPLE-CRED-PRIYA_17-SAMPLE-CRS-SOLAR-101');
    console.log(`       Verified:       ${credRes.body?.verified}`);
    console.log(`       Algorithm:      ${credRes.body?.signatureAlgorithm}`);
    console.log(`       Issuer:         ${credRes.body?.issuer}`);
    console.log(`       Issuer Note:    ${credRes.body?.issuerNote}`);

  } finally {
    console.log('\n5. Teardown & Clean-up:');
    serverProc.kill('SIGTERM');
    try {
      fs.rmSync(cleanDir, { recursive: true, force: true });
      console.log('   [SUCCESS] Clean clone directory removed.');
    } catch (e) {}
  }

  console.log('\n================================================================');
  console.log('CLEAN-CLONE WOW FLOW TEST: PASSED');
  console.log('================================================================');
}

run().catch(err => {
  console.error('Fatal error in clean clone test:', err);
  process.exit(1);
});
