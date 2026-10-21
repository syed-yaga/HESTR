import fs from 'fs';
import path from 'path';
import { RingBuffer } from '../src/edge/ring_buffer.js';
import { EdgeGatekeeper } from '../src/edge/gatekeeper.js';
import { reasonOnEscalation } from '../src/cloud/router.js';
import { TelemetryTick, EscalationPayload } from '../src/shared/types.js';
import { getMockMultimodalSnapshot } from '../src/shared/mock_frame.js';

async function main() {
  console.log(`\n================================================================`);
  console.log(`🔍 AGENT SKILL AUDITOR: SPECULATIVE TELEMETRY ROUTER`);
  console.log(`================================================================\n`);

  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const filePath = inputIndex !== -1 && args[inputIndex + 1] ? args[inputIndex + 1] : 'telemetry.ndjson';

  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Input file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`[Skill Audit] Ingesting telemetry stream from: ${filePath}`);
  const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').filter(Boolean);
  const ticks: TelemetryTick[] = lines.map((l) => JSON.parse(l));
  console.log(`[Skill Audit] Loaded ${ticks.length} ticks.`);

  const ringBuffer = new RingBuffer(3000);
  const gatekeeper = new EdgeGatekeeper({ timeoutMs: 300 });

  let anomalyTriggered = false;
  let suppressedTicks = 0;

  for (let i = 0; i < ticks.length; i++) {
    const tick = ticks[i];
    ringBuffer.push(tick);

    // Micro-batch check every 40 ticks or on spike
    if (i % 40 === 0 || Math.abs(tick.imu.accel_z_g) > 2.5) {
      const summary = ringBuffer.getCompactedSummary(2);
      const decision = await gatekeeper.evaluateMicroBatch(summary, tick);

      if (decision.gate_decision === 'escalate' && !anomalyTriggered) {
        anomalyTriggered = true;
        console.log(`\n🚨 [ANOMALY DETECTED AT TICK ${i}]`);
        console.log(`   Gatekeeper Model : gemma4:e4b-it-q4_K_M (Ollama)`);
        console.log(`   Decision Code    : ${decision.local_anomaly_code}`);
        console.log(`   Peak Accel-Z     : ${summary.peak_accel_g}g`);
        console.log(`   Max Gyro Pitch   : ${summary.max_pitch_dps} dps`);
        console.log(`   Rationale        : ${decision.rationale_short}`);
        console.log(`   Ticks Suppressed : ${suppressedTicks} ticks ($0.00 cloud egress)`);

        console.log(`\n☁️  [DISPATCHING MULTIMODAL ESCALATION TO CLOUD HEXAGON]`);
        const payload: EscalationPayload = {
          event_id: `esc_audit_${Date.now()}_usar`,
          device_id: tick.device_id,
          edge_model: 'ollama/gemma4:e4b-it-q4_K_M',
          cloud_target_provider: 'dual_gemini_and_do',
          telemetry_compaction: {
            ...summary,
            edge_rationale: decision.rationale_short
          },
          multimodal_snapshot: getMockMultimodalSnapshot()
        };

        const reasoning = await reasonOnEscalation(payload);

        console.log(`\n✅ [DUAL-PROVIDER CLOUD REASONING COMPLETE]`);
        console.log(`   Track A (Google DeepMind - gemma-4-31b-it):`);
        console.log(`   ${reasoning.primary_multimodal_analysis?.slice(0, 160)}...`);
        console.log(`\n   Track B (DigitalOcean Serverless - gemma-4-31b-it):`);
        console.log(`   ${reasoning.do_serverless_verification?.rationale?.slice(0, 160)}...`);
        console.log(`\n   Safety Directive : ${reasoning.action_plan?.recommended_action}`);
        console.log(`   Webhook Target   : ${reasoning.action_plan?.webhook_payload.target}`);
        console.log(`   Bandwidth Saved  : ${reasoning.metrics.bandwidth_saved_pct}%`);
        break;
      } else {
        suppressedTicks += summary.raw_ticks_suppressed;
      }
    }
  }

  if (!anomalyTriggered) {
    console.log(`\n✅ [AUDIT FINISHED] All ${ticks.length} ticks evaluated as NORMAL. Zero cloud egress triggered.`);
  }

  console.log(`\n================================================================\n`);
}

main().catch((err) => {
  console.error('[Skill Audit Error]', err);
  process.exit(1);
});
