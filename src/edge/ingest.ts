import fs from 'fs';
import path from 'path';
import { TelemetryTick, EscalationPayload, GateDecisionOutput } from '../shared/types.js';
import { RingBuffer } from './ring_buffer.js';
import { EdgeGatekeeper } from './gatekeeper.js';
import { EdgeWsClient } from './ws_client.js';

export interface IngestOptions {
  filePath?: string;
  wsUrl?: string;
  loop?: boolean;
  dryRun?: boolean;
  sampleIntervalMs?: number; // 20ms = 50Hz
}

export class TelemetryIngestPipeline {
  private ringBuffer: RingBuffer;
  private gatekeeper: EdgeGatekeeper;
  private wsClient: EdgeWsClient;
  private options: Required<IngestOptions>;
  private rawTicks: TelemetryTick[] = [];
  private tickIndex = 0;
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;

  // Running metrics
  private totalTicksIngested = 0;
  private ticksSuppressed = 0;
  private escalationsCount = 0;
  private lastEvaluationTick = 0;
  private lastEscalatedTime = 0;

  constructor(options?: IngestOptions) {
    this.options = {
      filePath: options?.filePath || path.resolve(process.cwd(), 'telemetry.ndjson'),
      wsUrl: options?.wsUrl || process.env.CLOUD_WS_URL || 'ws://localhost:8088/ws/telemetry',
      loop: options?.loop ?? true,
      dryRun: options?.dryRun ?? false,
      sampleIntervalMs: options?.sampleIntervalMs || 20 // 50Hz
    };

    this.ringBuffer = new RingBuffer(3000);
    this.gatekeeper = new EdgeGatekeeper();
    this.wsClient = new EdgeWsClient({ url: this.options.wsUrl });
  }

  public async init(): Promise<void> {
    console.log(`[Edge Ingest] Loading telemetry data from: ${this.options.filePath}`);
    if (!fs.existsSync(this.options.filePath)) {
      throw new Error(`Telemetry file not found: ${this.options.filePath}`);
    }

    const content = fs.readFileSync(this.options.filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    this.rawTicks = lines.map((line) => JSON.parse(line) as TelemetryTick);
    console.log(`[Edge Ingest] Loaded ${this.rawTicks.length} ticks. Target rate: 50Hz (${this.options.sampleIntervalMs}ms/tick).`);

    if (!this.options.dryRun) {
      await this.wsClient.connect();
    }
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[Edge Ingest] Ingestion pipeline started at 50Hz...`);

    return new Promise((resolve) => {
      this.timer = setInterval(async () => {
        if (!this.isRunning) {
          if (this.timer) clearInterval(this.timer);
          resolve();
          return;
        }

        await this.step();

        if (this.options.dryRun && this.totalTicksIngested >= 120) {
          this.stop();
          resolve();
        }
      }, this.options.sampleIntervalMs);
    });
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.wsClient.close();
    console.log(`[Edge Ingest] Pipeline stopped. Ingested: ${this.totalTicksIngested}, Suppressed: ${this.ticksSuppressed}, Escalated: ${this.escalationsCount}`);
  }

  /**
   * Executes a single 50Hz tick step (Filter 1 -> Filter 2 -> Sink)
   */
  private async step(): Promise<void> {
    if (this.rawTicks.length === 0) return;

    // Pick current tick
    const tick = this.rawTicks[this.tickIndex];
    this.tickIndex++;
    if (this.tickIndex >= this.rawTicks.length) {
      if (this.options.loop) {
        this.tickIndex = 0;
      } else {
        this.stop();
        return;
      }
    }

    this.totalTicksIngested++;
    this.ringBuffer.push(tick);

    // Filter 2 trigger: Every 2 seconds (100 ticks at 50Hz) OR immediate threshold breach
    const ticksSinceLastEval = this.totalTicksIngested - this.lastEvaluationTick;
    const isImmediateSpike = Math.abs(tick.imu.accel_z_g) > 2.5 || Math.abs(tick.imu.gyro_pitch_dps) > 30.0;
    const now = Date.now();

    let decision: GateDecisionOutput | undefined;

    if (ticksSinceLastEval >= 100 || (isImmediateSpike && now - this.lastEscalatedTime > 3000)) {
      this.lastEvaluationTick = this.totalTicksIngested;
      const compaction = this.ringBuffer.getCompactedSummary(2);
      decision = await this.gatekeeper.evaluateMicroBatch(compaction, tick);

      if (decision.gate_decision === 'escalate') {
        this.escalationsCount++;
        this.lastEscalatedTime = now;

        const payload: EscalationPayload = {
          event_id: `esc_${Date.now()}_${tick.device_id}`,
          device_id: tick.device_id,
          edge_model: 'ollama/gemma4:e4b-it-q4_K_M',
          cloud_target_provider: 'dual_gemini_and_do',
          telemetry_compaction: {
            ...compaction,
            edge_rationale: decision.rationale_short
          },
          multimodal_snapshot: this.ringBuffer.getLatestFrame()
        };

        this.wsClient.sendEscalation(payload);
      } else {
        // Normal or concern: Dropped locally ($0.00 cost, 0 KB egress)
        this.ticksSuppressed += compaction.raw_ticks_suppressed;
      }
    }

    // Forward tick for live 50Hz sparkline UI
    this.wsClient.sendTick(tick, decision);

    // Status log every 50 ticks (1 sec)
    if (this.totalTicksIngested % 50 === 0) {
      const pct = this.totalTicksIngested > 0 ? ((this.ticksSuppressed / this.totalTicksIngested) * 100).toFixed(1) : '100.0';
      process.stdout.write(
        `\r[50Hz Ingest] Ticks: ${this.totalTicksIngested} | Suppressed: ${this.ticksSuppressed} (${pct}%) | Escalated: ${this.escalationsCount} | Accel-Z: ${tick.imu.accel_z_g.toFixed(2)}g   `
      );
    }
  }

  public getStats() {
    return {
      totalTicks: this.totalTicksIngested,
      suppressed: this.ticksSuppressed,
      escalated: this.escalationsCount
    };
  }
}

// Run CLI directly if invoked
if (process.argv[1]?.endsWith('ingest.ts') || process.argv[1]?.endsWith('ingest.js')) {
  const isDryRun = process.argv.includes('--dry-run');
  const pipeline = new TelemetryIngestPipeline({ dryRun: isDryRun });

  pipeline.init()
    .then(() => pipeline.start())
    .catch((err) => {
      console.error('[Edge Ingest Error]', err);
      process.exit(1);
    });
}
