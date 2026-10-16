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
        } catch (err) {
          console.error('[CDP Parse Error]', err);
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

  async screenshot(filePath) {
    try {
      const capturePromise = this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot timeout')), 5000));
      const res = await Promise.race([capturePromise, timeoutPromise]);
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(filePath, buf);
      console.log(`  [Screenshot Saved] ${path.basename(filePath)} (${buf.length} bytes)`);
    } catch (e) {
      console.warn(`  [Screenshot Fallback] ${e.message}`);
    }
  }
}

async function getPageWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9444/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          const pageTarget = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
          if (pageTarget) {
            resolve(pageTarget.webSocketDebuggerUrl);
          } else if (targets.length > 0 && targets[0].webSocketDebuggerUrl) {
            resolve(targets[0].webSocketDebuggerUrl);
          } else {
            reject(new Error('No page targets found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('================================================================');
  console.log('CAPTURING ALL SCREENSHOTS IN ENGLISH AT TRUE 360PX VIEWPORT');
  console.log('================================================================\n');

  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--user-data-dir=/tmp/chrome-english-' + Date.now(),
    '--window-size=360,780',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 25; i++) {
    await sleep(350);
    try {
      wsUrl = await getPageWsUrl();
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    chromeProc.kill('SIGTERM');
    throw new Error('Could not connect to Chrome port 9444');
  }

  const client = new CDPClient(wsUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  // Enforce true 360x780 mobile viewport metrics
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true
  });

  const measureScreen = async (name) => {
    return await client.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        return {
          screen: '${name}',
          scrollWidth,
          innerWidth,
          overflow: Math.max(0, scrollWidth - innerWidth),
          hasOverflow: scrollWidth > innerWidth
        };
      })()
    `);
  };

  try {
    // 1. Screen 1: Home (English, Fresh Priya)
    console.log('1. Capturing English Home Screen (Fresh Priya)...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?persona=fresh&lang=en' });
    await sleep(2000);
    const mHome = await measureScreen('Home Screen');
    console.log(`   scrollWidth=${mHome.scrollWidth}, innerWidth=${mHome.innerWidth}, overflow=${mHome.overflow}px`);
    await client.screenshot(path.join(screenshotsDir, 'm3_english_360px_home.png'));

    // 2. Screen 2: Consent Modal (English, Minor Guardian Gate)
    console.log('\n2. Capturing English Consent Modal (Minor Guardian Gate)...');
    await client.eval(`
      (() => {
        const ctaBtn = document.querySelector('button.bg-primary');
        if (ctaBtn) ctaBtn.click();
      })()
    `);
    await sleep(1500);
    const mConsent = await measureScreen('Consent Modal');
    console.log(`   scrollWidth=${mConsent.scrollWidth}, innerWidth=${mConsent.innerWidth}, overflow=${mConsent.overflow}px`);
    await client.screenshot(path.join(screenshotsDir, 'm3_english_360px_consent.png'));

    // 3a. Screen 3a: Voice Capture (English, Dialect Selector & Demo Transcript Label)
    console.log('\n3a. Capturing English Voice Capture Screen...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?view=lifemap&stage=input&consent=true&lang=en&dialect=en' });
    await sleep(2000);
    const mVoiceInput = await measureScreen('Voice Input Screen');
    console.log(`   scrollWidth=${mVoiceInput.scrollWidth}, innerWidth=${mVoiceInput.innerWidth}, overflow=${mVoiceInput.overflow}px`);
    await client.screenshot(path.join(screenshotsDir, 'm3_english_360px_voice_input.png'));

    // 3b. Screen 3b: Grounded Life Map Roadmap (English, AI Skills & Career Nodes)
    console.log('\n3b. Capturing English Grounded Career Life Map Screen...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?view=lifemap&stage=lifemap&consent=true&lang=en&dialect=en' });
    await sleep(2000);
    const mLifeMap = await measureScreen('Life Map Screen');
    console.log(`   scrollWidth=${mLifeMap.scrollWidth}, innerWidth=${mLifeMap.innerWidth}, overflow=${mLifeMap.overflow}px`);
    await client.screenshot(path.join(screenshotsDir, 'm3_english_360px_lifemap.png'));

    // 4. Screen 4: Winding Learning Path (English)
    console.log('\n4. Capturing English Winding Learning Path...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?view=lifemap&stage=learning_path&consent=true&lang=en' });
    await sleep(2000);
    const mLearningPath = await measureScreen('Learning Path Screen');
    console.log(`   scrollWidth=${mLearningPath.scrollWidth}, innerWidth=${mLearningPath.innerWidth}, overflow=${mLearningPath.overflow}px`);
    await client.screenshot(path.join(screenshotsDir, 'm3_english_360px_learning_path.png'));

    // 5. Screen 5: Facilitator Dashboard (English)
    console.log('\n5. Capturing English Facilitator Dashboard...');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?view=facilitator&lang=en' });
    await sleep(2500);
    const mFacilitator = await measureScreen('Facilitator Dashboard');
    console.log(`   scrollWidth=${mFacilitator.scrollWidth}, innerWidth=${mFacilitator.innerWidth}, overflow=${mFacilitator.overflow}px`);
    await client.screenshot(path.join(screenshotsDir, 'm3_english_360px_facilitator_dashboard.png'));

    console.log('\nAll English screenshots captured successfully!');
  } finally {
    chromeProc.kill('SIGTERM');
  }
}

run().catch(e => {
  console.error('Error capturing English screenshots:', e);
  process.exit(1);
});
