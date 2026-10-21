import { reasonOnEscalation } from '../src/cloud/router.js';
import { EscalationPayload } from '../src/shared/types.js';
import { getMockMultimodalSnapshot } from '../src/shared/mock_frame.js';

async function main() {
  console.log('[Test Cloud] Testing Cloud Speculative Router with Promise.allSettled()...');

  const testPayload: EscalationPayload = {
    event_id: 'test_esc_1001_usar',
    device_id: 'usar-rover-node-04',
    edge_model: 'ollama/gemma4:e4b-it-q4_K_M',
    cloud_target_provider: 'dual_gemini_and_do',
    telemetry_compaction: {
      window_seconds: 2,
      raw_ticks_suppressed: 98,
      peak_accel_g: 3.42,
      max_pitch_dps: 48.5,
      geofence_transition: 'GGSIPU_EDC_CAMPUS_GATE_2 -> EXTERNAL_ROAD',
      edge_rationale: 'Z-axis acceleration hit 3.42g with 48.5 dps pitch spike.'
    },
    multimodal_snapshot: getMockMultimodalSnapshot()
  };

  const result = await reasonOnEscalation(testPayload);

  console.log('\n--- Cloud Reasoning Output ---');
  console.log('Event ID:', result.event_id);
  console.log('Gemini 31B Multimodal Output:', result.primary_multimodal_analysis?.slice(0, 80) + '...');
  console.log('DigitalOcean Verification:', result.do_serverless_verification?.rationale?.slice(0, 80) + '...');
  console.log('Action Plan Severity:', result.action_plan?.severity);
  console.log('Action Plan Webhook:', result.action_plan?.webhook_payload.target);
  console.log('Bandwidth Saved %:', result.metrics.bandwidth_saved_pct + '%');
  console.log('Total Latency:', result.latency_ms?.total_ms, 'ms');

  if (result.primary_multimodal_analysis && result.do_serverless_verification && result.action_plan) {
    console.log('\n✅ CLOUD HEXAGON VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('❌ Cloud test failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
