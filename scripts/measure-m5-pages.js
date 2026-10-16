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

function httpRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
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

async function measurePage(client, pageName) {
  const metrics = await client.eval(`
    (() => {
      const doc = document.documentElement;
      const body = document.body;
      const innerW = window.innerWidth;
      const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
      const overflows = [];
      const allEls = Array.from(document.querySelectorAll('*'));
      
      allEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > innerW + 1) {
          overflows.push({
            tag: el.tagName,
            cls: el.className ? String(el.className).slice(0, 40) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
      });

      // Interactive targets measurement
      const buttons = Array.from(document.querySelectorAll('button, a, input, select'));
      let smallestTarget = { tag: 'none', w: 999, h: 999 };
      buttons.forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.width < 500 && r.height < 500) {
          const area = r.width * r.height;
          const currArea = smallestTarget.w * smallestTarget.h;
          if (area < currArea) {
            smallestTarget = {
              tag: b.tagName,
              text: (b.innerText || b.getAttribute('aria-label') || '').slice(0, 25).trim(),
              w: Math.round(r.width),
              h: Math.round(r.height)
            };
          }
        }
      });

      const bodyStyle = window.getComputedStyle(body);
      const docStyle = window.getComputedStyle(doc);

      return {
        innerW,
        scrollW,
        hasHorizontalScroll: scrollW > innerW,
        overflowCount: overflows.length,
        overflowSample: overflows.slice(0, 3),
        smallestTarget,
        noHiddenOverflow: bodyStyle.overflowX !== 'hidden' && docStyle.overflowX !== 'hidden'
      };
    })()
  `);
  return metrics;
}

async function run() {
  console.log('================================================================');
  console.log('MEASURING M5 PAGES AT 360px VIEWPORT: /about, /showcase, /demo-frame');
  console.log('================================================================\n');

  // Launch Chrome on debugging port 9446
  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9446',
    '--user-data-dir=/tmp/chrome-m5-' + Date.now(),
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
      const res = await httpRequest('http://127.0.0.1:9446/json/version');
      if (res.statusCode === 200) {
        connected = true;
        break;
      }
    } catch (e) {}
  }

  if (!connected) {
    chromeProc.kill('SIGTERM');
    throw new Error('Could not connect to Chrome debugging port 9446');
  }

  try {
    const pages = [
      { name: '/about', url: 'http://localhost:5173/?view=about', shot: 'm5_360px_about.png' },
      { name: '/showcase', url: 'http://localhost:5173/?view=showcase', shot: 'm5_360px_showcase.png' },
      { name: '/demo-frame', url: 'http://localhost:5173/?view=demo-frame', shot: 'm5_360px_demo_frame.png' }
    ];

    for (const p of pages) {
      console.log(`Testing page: ${p.name} at 360px...`);
      const client = await openPage(9446, p.url);
      const metrics = await measurePage(client, p.name);
      console.log(`  Viewport: innerW=${metrics.innerW}px, scrollW=${metrics.scrollW}px (No horizontal scroll: ${!metrics.hasHorizontalScroll})`);
      console.log(`  Overflow elements > 360px: ${metrics.overflowCount}`);
      console.log(`  Smallest interactive target: <${metrics.smallestTarget.tag}> "${metrics.smallestTarget.text}" (${metrics.smallestTarget.w}x${metrics.smallestTarget.h}px)`);
      console.log(`  No overflow-x:hidden hack on html/body: ${metrics.noHiddenOverflow}`);

      await client.screenshot(path.join(screenshotsDir, p.shot));
      client.close();
      console.log('');
    }

  } finally {
    chromeProc.kill('SIGTERM');
  }

  console.log('================================================================');
  console.log('ALL M5 360PX MEASUREMENTS COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

run().catch(err => {
  console.error('Fatal error during 360px measurement:', err);
  process.exit(1);
});
