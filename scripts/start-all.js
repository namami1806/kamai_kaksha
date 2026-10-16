#!/usr/bin/env node

/**
 * Unified Monorepo Runner for Kamai Kaksha
 * Starts Node Express Server (port 5001), FastAPI Grounded AI Service (port 8001),
 * and Vite Client (port 5173) in one single command.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const processes = [];

function startProcess(name, command, args, cwd, colorCode) {
  console.log(`\x1b[1m\x1b[${colorCode}m[${name}]\x1b[0m Starting ${command} ${args.join(' ')} in ${cwd}...`);
  
  const proc = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUNBUFFERED: '1', PORT: name === 'SERVER' ? '5001' : process.env.PORT }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`\x1b[${colorCode}m[${name}]\x1b[0m ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.error(`\x1b[${colorCode}m[${name}]\x1b[0m ${line}`);
    });
  });

  proc.on('close', (code) => {
    console.log(`\x1b[${colorCode}m[${name}]\x1b[0m Process exited with code ${code}`);
  });

  processes.push(proc);
  return proc;
}

// 1. Start Node Server (port 5001)
const serverProc = startProcess('SERVER', 'node', ['src/index.js'], path.join(rootDir, 'server'), '34');

// 2. Start FastAPI AI Service (port 8001)
const aiProc = startProcess('AI-SERVICE', 'python3', ['app.py'], path.join(rootDir, 'ai-service'), '35');

// 3. Start Vite Client (port 5173)
const clientProc = startProcess('CLIENT', 'npm', ['run', 'dev', '--', '--port', '5173', '--host'], path.join(rootDir, 'client'), '32');

function cleanup() {
  console.log('\nShutting down Kamai Kaksha monorepo processes...');
  processes.forEach(proc => {
    try {
      proc.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
