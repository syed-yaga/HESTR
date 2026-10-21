import WebSocket from 'ws';
import { EscalationPayload, TelemetryTick, GateDecisionOutput, WireMessage } from '../shared/types.js';

export interface EdgeWsClientOptions {
  url?: string;
  autoReconnect?: boolean;
}

/**
 * Edge WebSocket Sink (Pipes & Filters Pattern)
 * Transmits compacted escalation payloads and live ticks to the Cloud Inbound Port.
 */
export class EdgeWsClient {
  private url: string;
  private ws: WebSocket | null = null;
  private autoReconnect: boolean;
  private isConnecting = false;
  private pendingQueue: string[] = [];

  constructor(options?: EdgeWsClientOptions) {
    this.url = options?.url || process.env.CLOUD_WS_URL || 'ws://localhost:8088/ws/telemetry';
    this.autoReconnect = options?.autoReconnect ?? true;
  }

  public connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.isConnecting = false;
          console.log(`[Edge WSS] Connected to Cloud Gateway at ${this.url}`);
          this.flushQueue();
          resolve();
        });

        this.ws.on('error', (err) => {
          console.warn(`[Edge WSS] Connection notice: ${err.message}`);
          this.isConnecting = false;
          resolve(); // Don't crash if cloud server isn't up yet
        });

        this.ws.on('close', () => {
          this.ws = null;
          this.isConnecting = false;
          if (this.autoReconnect) {
            setTimeout(() => {
              this.connect().catch(() => {});
            }, 2000);
          }
        });
      } catch {
        this.isConnecting = false;
        resolve();
      }
    });
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public send(msg: WireMessage): void {
    const raw = JSON.stringify(msg);
    if (this.isConnected()) {
      this.ws!.send(raw);
    } else {
      // Keep up to 20 recent messages in queue
      if (this.pendingQueue.length > 20) {
        this.pendingQueue.shift();
      }
      this.pendingQueue.push(raw);
    }
  }

  public sendTick(tick: TelemetryTick, gateDecision?: GateDecisionOutput): void {
    this.send({
      type: 'TELEMETRY_TICK',
      data: tick,
      gateDecision
    });
  }

  public sendEscalation(payload: EscalationPayload): void {
    console.log(`\n🚨 [Edge WSS] ESCALATING ANOMALY to Cloud: ${payload.event_id}`);
    console.log(`   Peak Accel: ${payload.telemetry_compaction.peak_accel_g}g | Pitch: ${payload.telemetry_compaction.max_pitch_dps} dps`);
    console.log(`   Model: ${payload.edge_model} -> Target: ${payload.cloud_target_provider}`);
    this.send({
      type: 'ESCALATION_TRIGGERED',
      data: payload
    });
  }

  private flushQueue(): void {
    while (this.pendingQueue.length > 0 && this.isConnected()) {
      const msg = this.pendingQueue.shift();
      if (msg) this.ws!.send(msg);
    }
  }

  public close(): void {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
