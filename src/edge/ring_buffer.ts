import { TelemetryTick, TelemetryCompaction, MultimodalSnapshot } from '../shared/types.js';
import { getMockMultimodalSnapshot } from '../shared/mock_frame.js';

/**
 * Filter 1: Ring Buffer (Pipes & Filters Pattern)
 * Maintains a 60-second sliding window of raw 50Hz telemetry ticks (up to 3,000 ticks)
 * and holds the latest visual camera frame.
 */
export class RingBuffer {
  private buffer: TelemetryTick[];
  private capacity: number;
  private latestFrame: MultimodalSnapshot;

  /**
   * @param capacity Maximum ticks to retain (default 3,000 = 60s at 50Hz)
   */
  constructor(capacity = 3000) {
    this.capacity = capacity;
    this.buffer = [];
    this.latestFrame = getMockMultimodalSnapshot();
  }

  /**
   * Pushes a new telemetry tick into the circular buffer.
   */
  public push(tick: TelemetryTick): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(tick);
  }

  /**
   * Updates the latest camera snapshot frame.
   */
  public setLatestFrame(frame: MultimodalSnapshot): void {
    this.latestFrame = frame;
  }

  /**
   * Returns the current visual frame.
   */
  public getLatestFrame(): MultimodalSnapshot {
    return this.latestFrame;
  }

  /**
   * Returns ticks recorded in the last `seconds`.
   */
  public getLastSeconds(seconds: number, sampleRateHz = 50): TelemetryTick[] {
    const count = Math.min(this.buffer.length, seconds * sampleRateHz);
    return this.buffer.slice(this.buffer.length - count);
  }

  /**
   * Returns the raw buffer count.
   */
  public size(): number {
    return this.buffer.length;
  }

  /**
   * Returns the most recent tick.
   */
  public peek(): TelemetryTick | undefined {
    return this.buffer[this.buffer.length - 1];
  }

  /**
   * Generates a compacted telemetry summary for micro-batch evaluation and escalation.
   */
  public getCompactedSummary(windowSeconds = 2, customRationale?: string): TelemetryCompaction {
    const ticks = this.getLastSeconds(windowSeconds);
    if (ticks.length === 0) {
      return {
        window_seconds: windowSeconds,
        raw_ticks_suppressed: 0,
        peak_accel_g: 1.0,
        max_pitch_dps: 0.0,
        geofence_transition: 'UNKNOWN -> UNKNOWN',
        edge_rationale: customRationale || 'No telemetry ticks available.'
      };
    }

    let peakAccel = 0;
    let maxPitch = 0;

    for (const t of ticks) {
      // Calculate magnitude or check max z-accel
      const absZ = Math.abs(t.imu.accel_z_g);
      if (absZ > peakAccel) peakAccel = absZ;

      const absPitch = Math.abs(t.imu.gyro_pitch_dps);
      if (absPitch > maxPitch) maxPitch = absPitch;
    }

    const firstZone = ticks[0].location.geofence_zone;
    const lastZone = ticks[ticks.length - 1].location.geofence_zone;
    const geofenceTransition = firstZone === lastZone ? firstZone : `${firstZone} -> ${lastZone}`;

    return {
      window_seconds: windowSeconds,
      raw_ticks_suppressed: ticks.length,
      peak_accel_g: Number(peakAccel.toFixed(2)),
      max_pitch_dps: Number(maxPitch.toFixed(1)),
      geofence_transition: geofenceTransition,
      edge_rationale:
        customRationale ||
        `Evaluated ${ticks.length} ticks over ${windowSeconds}s. Peak accel: ${peakAccel.toFixed(2)}g, max pitch: ${maxPitch.toFixed(1)} dps.`
    };
  }
}
