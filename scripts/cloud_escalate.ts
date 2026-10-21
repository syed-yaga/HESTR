import { reasonOnEscalation } from '../src/cloud/router.js';
import { EscalationPayload } from '../src/shared/types.js';
import { getMockMultimodalSnapshot } from '../src/shared/mock_frame.js';

async function main() {
  const eventId = process.argv[2]?.replace('--event', '').trim() || `esc_cli_${Date.now()}_usar`;

  const payload: EscalationPayload = {
    event_id: eventId,
    device_id: 'usar-rover-node-04',
    edge_model: 'ollama/gemma4:e4b-it-q4_K_M',
    cloud_target_provider: 'dual_gemini_and_do',
    telemetry_compaction: {
      window_seconds: 2,
      raw_ticks_suppressed: 98,
      peak_accel_g: 3.42,
      max_pitch_dps: 48.5,
      geofence_transition: 'GGSIPU_EDC_CAMPUS_GATE_2 -> EXTERNAL_ROAD',
      edge_rationale: 'CLI DIRECT ESCALATION: 3.42g impact spike verification requested.'
    },
    multimodal_snapshot: getMockMultimodalSnapshot()
  };

  console.log(`[Cloud Escalate CLI] Dispatching event: ${payload.event_id}`);
  const result = await reasonOnEscalation(payload);
  console.log(`\nResult:\n`, JSON.stringify(result, null, 2));
}

main().catch(console.error);
