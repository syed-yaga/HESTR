import React, { useState, useEffect, useRef } from 'react';
import { TelemetryTick, GateDecisionOutput, EscalationPayload, CloudReasoningResult, RouterMetrics, WireMessage } from '../../shared/types.js';
import { KPIRibbon } from './components/KPIRibbon.js';
import { EdgePane } from './components/EdgePane.js';
import { EscalationHandoffBeam } from './components/EscalationHandoffBeam.js';
import { CloudPane } from './components/CloudPane.js';
import { ControlToolbar } from './components/ControlToolbar.js';

export const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentTick, setCurrentTick] = useState<TelemetryTick | null>(null);
  const [latestDecision, setLatestDecision] = useState<GateDecisionOutput | null>(null);
  const [history, setHistory] = useState<TelemetryTick[]>([]);
  const [escalationPayload, setEscalationPayload] = useState<EscalationPayload | null>(null);
  const [reasoningResult, setReasoningResult] = useState<CloudReasoningResult | null>(null);
  const [isEscalated, setIsEscalated] = useState(false);

  const [metrics, setMetrics] = useState<RouterMetrics>({
    totalTicksIngested: 0,
    suppressedLocallyCount: 0,
    escalatedToCloudCount: 0,
    bandwidthSavedPct: 96.4,
    estimatedTokensSaved: 0
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Connect to Cloud WebSocket Port (Port 8088 with Vite proxy fallback)
  useEffect(() => {
    // Check if running on Vite dev server (5173) or directly on cloud port
    const isVite = window.location.port === '5173';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use direct port 8088 or Vite proxy
    const wsUrl = isVite
      ? `${wsProtocol}//${window.location.hostname}:8088/ws/telemetry`
      : `${wsProtocol}//${window.location.host}/ws/telemetry`;

    let socket: WebSocket;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        console.log(`[UI WS] Connected to Cloud Port at ${wsUrl}`);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WireMessage;
          switch (msg.type) {
            case 'TELEMETRY_TICK': {
              const tick = msg.data as TelemetryTick;
              setCurrentTick(tick);
              if (msg.gateDecision) {
                setLatestDecision(msg.gateDecision);
              }
              setHistory((prev) => {
                const next = [...prev, tick];
                return next.length > 70 ? next.slice(next.length - 70) : next;
              });
              break;
            }

            case 'ESCALATION_TRIGGERED': {
              const payload = msg.data as EscalationPayload;
              setEscalationPayload(payload);
              setIsEscalated(true);
              break;
            }

            case 'REASONING_COMPLETED': {
              const res = msg.data as CloudReasoningResult;
              setReasoningResult(res);
              setIsEscalated(true);
              break;
            }

            case 'METRICS_UPDATE': {
              setMetrics(msg.data as RouterMetrics);
              break;
            }
          }
        } catch (e) {
          console.error('[UI WS Parse Error]', e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        socket.close();
      };

      wsRef.current = socket;
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Demo Controls
  const handleInjectHazard = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'INJECT_HAZARD' }));
    } else {
      // Fallback via Vite proxy or direct port 8088
      const apiUrl = window.location.port === '5173'
        ? `http://${window.location.hostname}:8088/api/inject-hazard`
        : '/api/inject-hazard';
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        mode: 'cors'
      }).catch(console.error);
    }
  };

  const handleSimulateBump = () => {
    setLatestDecision({
      gate_decision: 'normal',
      confidence: 0.94,
      local_anomaly_code: 'SPEED_BUMP_DAMPENED',
      attach_visual_frame: false,
      rationale_short: 'Speed bump (1.42g) absorbed by active suspension. Cloud call dropped ($0.00 egress).'
    });
  };

  const handleReset = () => {
    setIsEscalated(false);
    setReasoningResult(null);
    setEscalationPayload(null);
    setLatestDecision({
      gate_decision: 'normal',
      confidence: 0.98,
      local_anomaly_code: 'NOMINAL_OPERATION',
      attach_visual_frame: false,
      rationale_short: 'Nominal cruise telemetry: 0.98g. Cloud call dropped (0 KB egress).'
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-mono">
      {/* Top KPI Ribbon */}
      <KPIRibbon
        metrics={metrics}
        isConnected={isConnected}
        activeProvider="Gemma 4 (DeepMind & DigitalOcean)"
      />

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-3 min-h-0 overflow-hidden">
        {/* Left Pane: Tier 1 Edge Node (Pipes & Filters) */}
        <div className="h-full min-h-0">
          <EdgePane
            currentTick={currentTick}
            latestDecision={latestDecision}
            history={history}
            isEscalated={isEscalated}
          />
        </div>

        {/* Center Handoff Beam */}
        <EscalationHandoffBeam isEscalated={isEscalated} />

        {/* Right Pane: Tier 2 Cloud Hexagon (Ports & Adapters) */}
        <div className="h-full min-h-0">
          <CloudPane
            reasoningResult={reasoningResult}
            escalationPayload={escalationPayload}
            isEscalated={isEscalated}
          />
        </div>
      </main>

      {/* Bottom Interactive Pitch Toolbar */}
      <ControlToolbar
        onInjectHazard={handleInjectHazard}
        onSimulateBump={handleSimulateBump}
        onReset={handleReset}
        isEscalated={isEscalated}
      />
    </div>
  );
};
