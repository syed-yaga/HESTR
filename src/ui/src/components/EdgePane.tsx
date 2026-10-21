import React, { useEffect, useRef } from 'react';
import { TelemetryTick, GateDecisionOutput } from '../../../shared/types.js';
import { Radio, Gauge, Compass, BatteryCharging, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EdgePaneProps {
  currentTick: TelemetryTick | null;
  latestDecision: GateDecisionOutput | null;
  history: TelemetryTick[];
  isEscalated: boolean;
}

export const EdgePane: React.FC<EdgePaneProps> = ({
  currentTick,
  latestDecision,
  history,
  isEscalated
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 60FPS High-Speed Oscilloscope Waveform Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Dark oscilloscope canvas clear
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Phosphor grid lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Zero baseline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (history.length > 1) {
        const stepX = width / Math.max(history.length - 1, 60);

        // 1. Draw Accel-Z (Primary Anomaly Vector)
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        history.forEach((t, i) => {
          const x = i * stepX;
          // Scale Z: 1.0g = midY, 3.42g reaches near top
          const y = midY - (t.imu.accel_z_g - 1.0) * (height / 4.5);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        // Color shift from amber to intense red if elevated
        const peakZ = Math.max(...history.map(h => h.imu.accel_z_g));
        ctx.strokeStyle = peakZ > 2.5 ? '#ef4444' : '#f59e0b';
        ctx.shadowColor = peakZ > 2.5 ? '#ef4444' : '#f59e0b';
        ctx.shadowBlur = peakZ > 2.5 ? 12 : 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 2. Draw Gyro Pitch DPS (Cyan secondary curve)
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        history.forEach((t, i) => {
          const x = i * stepX;
          const y = midY - (t.imu.gyro_pitch_dps / 50.0) * (height / 2.8);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Legend overlay inside canvas
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px monospace';
      ctx.fillText('■ ACCEL Z (G)', 12, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('■ GYRO PITCH (DPS)', 110, 18);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [history]);

  const accelZ = currentTick?.imu.accel_z_g ?? 0.98;
  const pitchDps = currentTick?.imu.gyro_pitch_dps ?? 1.2;
  const isNormal = !isEscalated && (latestDecision?.gate_decision === 'normal' || accelZ < 2.5);

  return (
    <div className={`flex flex-col h-full bg-obsidian-card rounded-xl border transition-all duration-300 overflow-hidden ${
      isEscalated ? 'hud-border-amber' : 'border-slate-800'
    }`}>
      {/* Pane Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Tier 1: Edge Node
            </h2>
            <p className="text-[10px] text-slate-400">Pipes & Filters Stream (50Hz Tick)</p>
          </div>
        </div>

        {/* Gatekeeper Decision Pill */}
        <div className="flex items-center">
          {isNormal ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 shadow-sm shadow-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              NORMAL (0 KB Egress / $0.00)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/90 border border-rose-500 text-rose-300 animate-pulse shadow-md shadow-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ESCALATE TO 31B
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Real-time Oscilloscope Screen */}
        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black/90 shadow-inner">
          <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>50Hz RING BUFFER (60s)</span>
          </div>
          <canvas
            ref={canvasRef}
            width={580}
            height={160}
            className="w-full h-40 block"
          />
        </div>

        {/* Rover Sensor HUD Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Accel Z */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3 h-3 text-amber-400" /> Accel-Z Shock
            </div>
            <div className={`text-base font-bold font-mono ${accelZ > 2.5 ? 'text-rose-400 animate-bounce' : 'text-slate-100'}`}>
              {accelZ.toFixed(2)} <span className="text-[11px] text-slate-400 font-normal">g</span>
            </div>
          </div>

          {/* Gyro Pitch */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" /> Gyro Pitch
            </div>
            <div className={`text-base font-bold font-mono ${pitchDps > 30.0 ? 'text-amber-400' : 'text-slate-100'}`}>
              {pitchDps.toFixed(1)} <span className="text-[11px] text-slate-400 font-normal">dps</span>
            </div>
          </div>

          {/* Cellular RSSI */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Wifi className="w-3 h-3 text-blue-400" /> RSSI Signal
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {currentTick?.system.rssi_dbm ?? -65} <span className="text-[11px] text-slate-400 font-normal">dBm</span>
            </div>
          </div>

          {/* Battery */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-emerald-400" /> Battery
            </div>
            <div className="text-base font-bold font-mono text-emerald-300">
              {currentTick?.system.battery_pct ?? 42}%
            </div>
          </div>
        </div>

        {/* Location & Geofence Badge */}
        <div className="px-3.5 py-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase text-slate-400">Geofence:</span>
            <span className="px-2 py-0.5 rounded font-mono text-amber-300 bg-amber-950/60 border border-amber-800/50 text-[11px]">
              {currentTick?.location.geofence_zone || 'GGSIPU_EDC_CAMPUS_ZONE_A'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            SPD: {currentTick?.location.speed_mps ?? 6.8} mps • LAT: {currentTick?.location.lat ?? 28.6542}°
          </div>
        </div>

        {/* Speculative SLM Gatekeeper Card */}
        <div className="mt-auto p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Filter 2: Edge SLM Gatekeeper
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              ollama/gemma4:e4b-it-q4_K_M
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
            {latestDecision?.rationale_short || 'Evaluating 2s micro-batch (40 ticks compacted). Steady cruise within safety margins.'}
          </p>
        </div>
      </div>
    </div>
  );
};
