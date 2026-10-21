import fs from 'fs';
import { RingBuffer } from '../src/edge/ring_buffer.js';
import { EdgeGatekeeper } from '../src/edge/gatekeeper.js';
import { TelemetryTick } from '../src/shared/types.js';

async function main() {
  console.log('[Test Edge] Reading telemetry.ndjson...');
  const lines = fs.readFileSync('telemetry.ndjson', 'utf-8').split('\n').filter(Boolean);
  const ticks: TelemetryTick[] = lines.map((l) => JSON.parse(l));

  const ring = new RingBuffer(3000);
  const gatekeeper = new EdgeGatekeeper({ timeoutMs: 200 });

  // 1. Test nominal cruise evaluation (first 100 ticks)
  for (let i = 0; i < 100; i++) {
    ring.push(ticks[i]);
  }
  const nominalSummary = ring.getCompactedSummary(2);
  const nominalDecision = await gatekeeper.evaluateMicroBatch(nominalSummary, ticks[99]);
  console.log('Nominal Cruise -> Decision:', nominalDecision.gate_decision, '| Confidence:', nominalDecision.confidence);

  // 2. Test anomaly impact spike (ticks 415-425)
  for (let i = 100; i <= 422; i++) {
    ring.push(ticks[i]);
  }
  const anomalySummary = ring.getCompactedSummary(2);
  const anomalyDecision = await gatekeeper.evaluateMicroBatch(anomalySummary, ticks[422]);
  console.log('Impact Spike   -> Decision:', anomalyDecision.gate_decision, '| Anomaly Code:', anomalyDecision.local_anomaly_code);
  console.log('Peak Accel Z   :', anomalySummary.peak_accel_g, 'g | Max Pitch:', anomalySummary.max_pitch_dps, 'dps');

  if (nominalDecision.gate_decision === 'normal' && anomalyDecision.gate_decision === 'escalate') {
    console.log('\n✅ EDGE PIPELINE VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ Unexpected decisions:', { nominal: nominalDecision, anomaly: anomalyDecision });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
