import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');

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

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
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
  console.log('=== STARTING 360PX VIEWPORT & TAP TARGET MEASUREMENT ===');

  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-360-flow-' + Date.now(),
    '--window-size=360,780',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      wsUrl = await getWsUrl();
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) throw new Error('Could not connect to Chrome port 9222');
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  try {
    // 1. Measure Home Screen at 360px
    console.log('\n--- Measuring Home Screen at 360px ---');
    await client.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const homeMetrics = await client.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const interactive = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]'));
        const smallTargets = [];

        interactive.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              smallTargets.push({
                element: el.tagName,
                text: (el.innerText || el.getAttribute('aria-label') || el.name || '').trim().substring(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              });
            }
          }
        });

        return {
          page: 'Home Screen',
          scrollWidth,
          innerWidth,
          overflow: Math.max(0, scrollWidth - innerWidth),
          hasOverflow: scrollWidth > innerWidth,
          totalInteractive: interactive.length,
          smallTargetsCount: smallTargets.length,
          smallTargets
        };
      })()
    `);

    console.log(JSON.stringify(homeMetrics, null, 2));
    await client.screenshot(path.join(screenshotsDir, 'real_flow_6_360px_mobile.png'));

    // 2. Measure Life Map Screen at 360px
    console.log('\n--- Measuring Life Map Screen at 360px ---');
    await client.send('Page.navigate', { url: 'http://localhost:5173/?view=lifemap&consent=true' });
    await sleep(2000);

    const lifeMapMetrics = await client.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const interactive = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]'));
        const smallTargets = [];

        interactive.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              smallTargets.push({
                element: el.tagName,
                text: (el.innerText || el.getAttribute('aria-label') || el.name || '').trim().substring(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              });
            }
          }
        });

        return {
          page: 'Life Map Screen',
          scrollWidth,
          innerWidth,
          overflow: Math.max(0, scrollWidth - innerWidth),
          hasOverflow: scrollWidth > innerWidth,
          totalInteractive: interactive.length,
          smallTargetsCount: smallTargets.length,
          smallTargets
        };
      })()
    `);

    console.log(JSON.stringify(lifeMapMetrics, null, 2));

    // 3. Check Chrome SpeechSynthesis Voices
    console.log('\n--- Checking Chrome SpeechSynthesis Voices (Item 7) ---');
    const voicesResult = await client.eval(`
      (() => {
        if (!('speechSynthesis' in window)) return { supported: false, total: 0, hindiCount: 0, voices: [] };
        const voices = window.speechSynthesis.getVoices();
        const hindiVoices = voices.filter(v => v.lang.toLowerCase().startsWith('hi'));
        return {
          supported: true,
          total: voices.length,
          hindiCount: hindiVoices.length,
          hindiVoices: hindiVoices.map(v => ({ name: v.name, lang: v.lang, default: v.default }))
        };
      })()
    `);
    console.log(JSON.stringify(voicesResult, null, 2));

  } finally {
    chromeProc.kill('SIGTERM');
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
