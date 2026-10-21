import { spawn } from 'child_process';
import path from 'path';

console.log(`\n=============================================================`);
console.log(`🚀 LAUNCHING HYBRID EDGE-TO-CLOUD SPECULATIVE ROUTER SYSTEM`);
console.log(`   Hacktoberfest Hack Day New Delhi`);
console.log(`   Tracks: Google DeepMind (Gemma 4) & DigitalOcean Serverless`);
console.log(`=============================================================\n`);

// 1. Launch Cloud Fastify WS Port
const cloud = spawn('npx', ['tsx', 'src/cloud/server.ts'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

// Wait 1.5s for Cloud WS to initialize before starting UI & Edge
setTimeout(() => {
  // 2. Launch Vite UI Server
  const ui = spawn('npx', ['vite', 'src/ui', '--port', '5173'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  // 3. Launch Edge Ingestion Pipeline
  setTimeout(() => {
    const edge = spawn('npx', ['tsx', 'src/edge/ingest.ts'], {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });

    const cleanup = () => {
      console.log('\n[HESTR] Shutting down all processes...');
      cloud.kill();
      ui.kill();
      edge.kill();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }, 1000);
}, 1500);
