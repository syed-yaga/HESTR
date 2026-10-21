/**
 * Data Contracts & Wire Protocol for Hybrid Edge-to-Cloud Speculative Telemetry Router
 * Defined according to Hackathon PRD specifications.
 */

/**
 * 3.1 High-Frequency Local Telemetry Tick (Ingested at Edge at 50Hz)
 */
export interface TelemetryTick {
  device_id: string; // e.g. "usar-rover-node-04"
  timestamp_ms: number;
  location: {
    lat: number;
    lng: number;
    geofence_zone: string;
    speed_mps: number;
  };
  imu: {
    accel_x_g: number;
    accel_y_g: number;
    accel_z_g: number;
    gyro_pitch_dps: number;
  };
  system: {
    battery_pct: number;
    rssi_dbm: number;
  };
}

/**
 * 3.2 Edge `gemma4:e4b` Speculative Gate Output
 */
export interface GateDecisionOutput {
  gate_decision: 'normal' | 'concern' | 'escalate';
  confidence: number;
  local_anomaly_code: string; // e.g. "IMPACT_SPIKE_AT_GEOFENCE_BOUNDARY"
  attach_visual_frame: boolean;
  rationale_short: string;
}

/**
 * Summary telemetry compaction delta attached to escalation
 */
export interface TelemetryCompaction {
  window_seconds: number;
  raw_ticks_suppressed: number;
  peak_accel_g: number;
  max_pitch_dps: number;
  geofence_transition: string;
  edge_rationale: string;
}

/**
 * Multimodal snapshot frame payload
 */
export interface MultimodalSnapshot {
  mime_type: string; // "image/jpeg" or "image/png"
  base64_data: string;
  capture_source?: string; // e.g. "front_hazard_cam_640x360"
}

/**
 * 3.3 Compacted WebSocket Escalation Payload (Edge -> Cloud)
 */
export interface EscalationPayload {
  event_id: string; // e.g. "esc_9042_usar"
  device_id: string;
  edge_model: string; // "ollama/gemma4:e4b-it-q4_K_M"
  cloud_target_provider: 'gemini_api' | 'do_serverless' | 'dual_gemini_and_do';
  telemetry_compaction: TelemetryCompaction;
  multimodal_snapshot: MultimodalSnapshot;
}

/**
 * Structured Action Plan emitted by Cloud Reasoning Engine
 */
export interface ActionPlan {
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
  hazard_type: string;
  recommended_action: string;
  webhook_payload: {
    target: string;
    dispatched_at_ms: number;
    status: 'DISPATCHED' | 'ACKNOWLEDGED' | 'SIMULATED';
    incident_id: string;
  };
}

/**
 * Cloud Reasoning Result returned after dual-provider speculative execution
 */
export interface CloudReasoningResult {
  event_id: string;
  primary_multimodal_analysis: string | null;
  do_serverless_verification: any;
  metrics: {
    ticks_filtered_at_edge: number;
    bandwidth_saved_pct: number;
  };
  action_plan?: ActionPlan;
  latency_ms?: {
    gemini_ms?: number;
    do_serverless_ms?: number;
    total_ms: number;
  };
}

/**
 * Real-time KPI Ribbon Metrics
 */
export interface RouterMetrics {
  totalTicksIngested: number;
  suppressedLocallyCount: number;
  escalatedToCloudCount: number;
  bandwidthSavedPct: number;
  estimatedTokensSaved: number;
}

/**
 * Wire messages broadcast across WebSockets between Edge, Cloud, and UI
 */
export type WireMessage =
  | { type: 'TELEMETRY_TICK'; data: TelemetryTick; gateDecision?: GateDecisionOutput }
  | { type: 'ESCALATION_TRIGGERED'; data: EscalationPayload }
  | { type: 'REASONING_COMPLETED'; data: CloudReasoningResult }
  | { type: 'METRICS_UPDATE'; data: RouterMetrics }
  | { type: 'INJECT_HAZARD'; payload?: { severity?: 'CRITICAL'; reason?: string } };
