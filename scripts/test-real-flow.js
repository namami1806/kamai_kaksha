import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Use ws from server
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');

// Simple CDP client helper
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
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

  async screenshot(filePath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buf);
    console.log(`[Screenshot Saved] ${filePath} (${buf.length} bytes)`);
  }
}

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tabs = JSON.parse(data);
          if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
            resolve(tabs[0].webSocketDebuggerUrl);
          } else {
            reject(new Error('No tabs with webSocketDebuggerUrl found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== STARTING REAL FLOW VERIFICATION SCRIPT ===');
  
  // 1. Launch Chrome with CDP
  console.log('1. Launching Headless Chrome on port 9222...');
  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-test-flow-' + Date.now(),
    '--window-size=1200,900',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for Chrome port to become available
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      wsUrl = await getWsUrl();
      if (wsUrl) break;
    } catch (e) {
      // retry
    }
  }

  if (!wsUrl) {
    throw new Error('Failed to connect to Chrome debugging port 9222');
  }

  console.log(`Connected to Chrome CDP at: ${wsUrl}`);
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');

  try {
    // STEP 1: Navigate to Home (Fresh Priya)
    console.log('\n--- STEP 1: Loading Fresh Priya on http://localhost:5173/ ---');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?persona=fresh' });
    await sleep(2000);

    const personaText = await client.eval(`document.body.innerText.includes('Priya')`);
    console.log(`Page loaded. Priya present in DOM: ${personaText}`);

    // STEP 2: Click "Voice Life Map खोलें" (Trigger Consent Gate)
    console.log('\n--- STEP 2: Triggering Life Map CTA -> Opening Consent Modal ---');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('लाइफ मैप') || b.innerText.includes('Life Map'));
      if (btn) btn.click();
      else throw new Error('Life Map CTA button not found');
    `);
    await sleep(1000);

    const isConsentOpen = await client.eval(`!!document.querySelector('input[type="checkbox"]')`);
    console.log(`Consent modal opened: ${isConsentOpen}`);

    // Capture Screenshot of Consent Gate with Under-18 Guardian Step
    const screenshotConsentPath = path.join(screenshotsDir, 'real_flow_1_consent_modal.png');
    await client.screenshot(screenshotConsentPath);

    // STEP 3: Grant Student & Guardian Consent
    console.log('\n--- STEP 3: Completing Guardian Consent for Minor (Priya, 17) ---');
    await client.eval(`
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      checkboxes.forEach(c => {
        if (!c.checked) {
          c.click();
          c.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    `);
    await sleep(800); // Allow React state to update and enable submit button

    await client.eval(`
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => 
        (b.innerText.includes('सहमति दें') || b.innerText.includes('Grant Consent')) && !b.disabled
      );
      if (submitBtn) {
        submitBtn.click();
      } else {
        throw new Error('Submit consent button is disabled or not found');
      }
    `);
    await sleep(2000);

    const onLifeMapScreen = await client.eval(`document.body.innerText.includes('Voice Life Map') || document.body.innerText.includes('हुनर पहचान')`);
    console.log(`Consent granted. Now on Voice Life Map screen: ${onLifeMapScreen}`);

    // STEP 4: Simulate DevTools Offline
    console.log('\n--- STEP 4: Setting Network to OFFLINE (Emulating DevTools Offline) ---');
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });
    console.log('DevTools Offline condition active.');

    // STEP 5: Record Audio with MediaRecorder / Priya's Voice Button
    console.log('\n--- STEP 5: Recording Voice in Offline Mode (Queuing to IndexedDB audio_queue) ---');
    await client.eval(`
      const simBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('डेमो: प्रिया की आवाज़') || b.innerText.includes('प्रिया की आवाज़'));
      if (simBtn) {
        simBtn.click();
      } else {
        const mic = document.getElementById('voice-pill');
        if (mic) mic.click();
      }
    `);
    await sleep(2500);

    // Inspect IndexedDB
    const idbState = await client.eval(`
      (async () => {
        return new Promise((resolve) => {
          const req = indexedDB.open('kamai-kaksha-db', 2);
          req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(['audio_queue', 'sync_queue'], 'readonly');
            const audioStore = tx.objectStore('audio_queue');
            const syncStore = tx.objectStore('sync_queue');
            let audioItems = [];
            let syncItems = [];
            audioStore.getAll().onsuccess = (ev) => {
              audioItems = ev.target.result;
              syncStore.getAll().onsuccess = (ev2) => {
                syncItems = ev2.target.result;
                resolve({
                  audioQueueCount: audioItems.length,
                  audioIds: audioItems.map(a => a.id),
                  syncQueueCount: syncItems.length,
                  syncTypes: syncItems.map(s => s.eventType)
                });
              };
            };
          };
          req.onerror = () => resolve({ error: 'Failed to open IDB' });
        });
      })()
    `);

    console.log('IndexedDB State after offline recording:');
    console.log(JSON.stringify(idbState, null, 2));

    const screenshotOfflineQueuePath = path.join(screenshotsDir, 'real_flow_2_offline_audio_queued.png');
    await client.screenshot(screenshotOfflineQueuePath);

    // STEP 6: Hard Page Reload (Testing Persistence across Refresh)
    console.log('\n--- STEP 6: Triggering Hard Page Refresh (Testing Persistence) ---');
    // Re-enable network temporarily for Vite dev server HTML reload
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });
    // Reload into lifemap tab so it mounts and reads IndexedDB
    await client.send('Page.navigate', { url: 'http://localhost:5173/?view=lifemap&consent=true' });
    await sleep(2500);

    // Re-enable offline condition immediately
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    // Query IndexedDB again after hard refresh
    const idbStateAfterRefresh = await client.eval(`
      (async () => {
        return new Promise((resolve) => {
          const req = indexedDB.open('kamai-kaksha-db', 2);
          req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(['audio_queue', 'sync_queue'], 'readonly');
            let audioItems = [];
            let syncItems = [];
            tx.objectStore('audio_queue').getAll().onsuccess = (ev) => {
              audioItems = ev.target.result;
              tx.objectStore('sync_queue').getAll().onsuccess = (ev2) => {
                syncItems = ev2.target.result;
                resolve({
                  audioQueueCount: audioItems.length,
                  syncQueueCount: syncItems.length,
                  survivedRefresh: audioItems.length > 0 && syncItems.length > 0
                });
              };
            };
          };
        });
      })()
    `);

    console.log('IndexedDB State after hard page refresh:');
    console.log(JSON.stringify(idbStateAfterRefresh, null, 2));

    const screenshotRefreshedPath = path.join(screenshotsDir, 'real_flow_3_refreshed_still_queued.png');
    await client.screenshot(screenshotRefreshedPath);

    // STEP 7: Test Stopping Server Mid-Flow (Item 3)
    console.log('\n--- STEP 7: Testing Server Failure Mid-Flow (Confirm Queued Items Stay Pending) ---');
    // Turn network online, but test syncing against an unreachable port or invalid endpoint
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    // Try syncing against stopped/dead server endpoint http://localhost:9999/api/sync
    const syncFailureResult = await client.eval(`
      (async () => {
        // Direct test of flushSyncQueue against stopped server port
        const res = await window.__kamai_idb.flushSyncQueue('http://127.0.0.1:9999/api/sync');
        const pendingCount = await window.__kamai_idb.getPendingSyncCount();
        const pendingItems = await window.__kamai_idb.getAllPendingEvents();
        
        return {
          syncCallResult: res,
          pendingCountAfterFailure: pendingCount,
          isPendingPreserved: pendingCount > 0,
          pendingItemsStatus: pendingItems.map(i => ({ id: i.id, status: i.status }))
        };
      })()
    `);

    console.log('Sync result with server unreachable (Item 3 confirmation):');
    console.log(JSON.stringify(syncFailureResult, null, 2));

    // STEP 8: Go Online -> Upload, Transcribe & Purge Audio
    console.log('\n--- STEP 8: Live Sync against Real Backend -> Transcribe & Purge Audio Blob ---');
    const syncSuccessResult = await client.eval(`
      (async () => {
        const syncBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('Sync & Purge') || 
          b.innerText.includes('ऑनलाइन जाएं') ||
          b.innerText.includes('सहेजे गए ऑडियो से लाइफ मैप')
        );
        if (syncBtn) {
          syncBtn.click();
        }
        return 'Sync initiated';
      })()
    `);
    console.log(syncSuccessResult);
    await sleep(3500);

    // Verify audio_queue is now 0 (permanently deleted in compliance with DPDP)
    const idbStatePostSync = await client.eval(`
      (async () => {
        return new Promise((resolve) => {
          const req = indexedDB.open('kamai-kaksha-db', 2);
          req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(['audio_queue', 'sync_queue'], 'readonly');
            let audioItems = [];
            let syncItems = [];
            tx.objectStore('audio_queue').getAll().onsuccess = (ev) => {
              audioItems = ev.target.result;
              tx.objectStore('sync_queue').getAll().onsuccess = (ev2) => {
                syncItems = ev2.target.result;
                resolve({
                  audioQueueCount: audioItems.length,
                  syncQueueCount: syncItems.length,
                  audioPurgedSuccessfully: audioItems.length === 0
                });
              };
            };
          };
        });
      })()
    `);

    console.log('IndexedDB State post-sync (DPDP compliance verification):');
    console.log(JSON.stringify(idbStatePostSync, null, 2));

    // Capture Screenshot of Grounded Life Map
    const screenshotLifeMapPath = path.join(screenshotsDir, 'real_flow_4_lifemap_grounded.png');
    await client.screenshot(screenshotLifeMapPath);

    // STEP 9: Proceed to Winding Learning Path
    console.log('\n--- STEP 9: Navigating to Winding Learning Path ---');
    await client.eval(`
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('लर्निंग पाथ') || b.innerText.includes('Learning Path'));
      if (nextBtn) nextBtn.click();
    `);
    await sleep(1500);

    const screenshotLearningPath = path.join(screenshotsDir, 'real_flow_5_winding_learning_path.png');
    await client.screenshot(screenshotLearningPath);

    // STEP 10: 360px Viewport Measurement & Tap Targets Check (Item 5)
    console.log('\n--- STEP 10: Measuring 360px Viewport Overflow & Tap Targets ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 780,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(1000);

    const viewportMetrics = await client.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasOverflow = scrollWidth > innerWidth;

        // Check tap targets
        const interactiveElements = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]'));
        const smallTargets = [];

        interactiveElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // Filter visible elements
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              smallTargets.push({
                tag: el.tagName,
                text: el.innerText ? el.innerText.trim().substring(0, 25) : el.placeholder || '',
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              });
            }
          }
        });

        return {
          scrollWidth,
          innerWidth,
          hasOverflow,
          overflowPixels: Math.max(0, scrollWidth - innerWidth),
          totalInteractive: interactiveElements.length,
          smallTargetsCount: smallTargets.length,
          smallTargetsSample: smallTargets.slice(0, 5)
        };
      })()
    `);

    console.log('360px Mobile Measurement:');
    console.log(JSON.stringify(viewportMetrics, null, 2));

    const screenshot360Path = path.join(screenshotsDir, 'real_flow_6_360px_mobile.png');
    await client.screenshot(screenshot360Path);

    // STEP 11: Chrome SpeechSynthesis Voices Check (Item 7)
    console.log('\n--- STEP 11: Checking SpeechSynthesis Voices in Chrome ---');
    const voicesData = await client.eval(`
      (() => {
        if (!('speechSynthesis' in window)) return { supported: false, hindiVoices: [] };
        const voices = window.speechSynthesis.getVoices();
        const hindiVoices = voices.filter(v => v.lang.toLowerCase().startsWith('hi'));
        return {
          supported: true,
          totalVoices: voices.length,
          hindiVoicesCount: hindiVoices.length,
          hindiVoices: hindiVoices.map(v => ({ name: v.name, lang: v.lang }))
        };
      })()
    `);
    console.log('Chrome SpeechSynthesis Data:');
    console.log(JSON.stringify(voicesData, null, 2));

    console.log('\n=== REAL FLOW VERIFICATION COMPLETE ===');

  } finally {
    await client.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
    chromeProc.kill('SIGTERM');
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
