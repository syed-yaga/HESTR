import React from 'react';
import { RouterMetrics } from '../../../shared/types.js';
import { ShieldCheck, Cpu, Cloud, DollarSign, Activity, Zap } from 'lucide-react';

interface KPIRibbonProps {
  metrics: RouterMetrics;
  isConnected: boolean;
  activeProvider: string;
}

export const KPIRibbon: React.FC<KPIRibbonProps> = ({ metrics, isConnected, activeProvider }) => {
  // Estimated cloud bill if all ticks were streamed continuously vs actual edge cost
  const rawCostEstimated = (metrics.totalTicksIngested * 0.0008).toFixed(3);
  const actualCost = ((metrics.escalatedToCloudCount || 0) * 0.0012).toFixed(3);
  const savedDollars = (Math.max(0, Number(rawCostEstimated) - Number(actualCost))).toFixed(3);

  return (
    <header className="bg-obsidian-light/90 border-b border-slate-800 backdrop-blur-md px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Mission Badge */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950 border border-hud-cyan/50 shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-hud-cyan animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-wider text-slate-100 flex items-center gap-2">
                HESTR <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/60 border border-hud-cyan/40 text-hud-cyan font-normal">v1.0-SPECULATIVE</span>
              </h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isConnected 
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                {isConnected ? 'PORT 8088 SYNC' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight">
              Hybrid Edge-to-Cloud Speculative Telemetry Router • Hacktoberfest Hack Day New Delhi
            </p>
          </div>
        </div>

        {/* Sponsor Badges */}
        <div className="hidden xl:flex items-center space-x-2">
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>DigitalOcean Serverless</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Google DeepMind (Gemma 4)</span>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Total Ingested */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" /> Ingested (50Hz)
            </div>
            <div className="text-sm font-bold text-slate-200">
              {metrics.totalTicksIngested.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">ticks</span>
            </div>
          </div>

          {/* Suppressed Locally */}
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-left">
            <div className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Suppressed (E4B)
            </div>
            <div className="text-sm font-bold text-emerald-300">
              {metrics.suppressedLocallyCount.toLocaleString()} <span className="text-[10px] text-emerald-500 font-normal">({metrics.totalTicksIngested > 0 ? ((metrics.suppressedLocallyCount / metrics.totalTicksIngested) * 100).toFixed(1) : '99.9'}%)</span>
            </div>
          </div>

          {/* Escalated to Cloud */}
          <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-left">
            <div className="text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Cloud className="w-3 h-3" /> Escalated (31B)
            </div>
            <div className="text-sm font-bold text-amber-300">
              {metrics.escalatedToCloudCount} <span className="text-[10px] text-amber-500 font-normal">events</span>
            </div>
          </div>

          {/* Bandwidth Savings */}
          <div className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-left">
            <div className="text-[10px] text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Bandwidth Saved
            </div>
            <div className="text-sm font-bold text-cyan-300">
              {metrics.bandwidthSavedPct}% <span className="text-[10px] text-cyan-500 font-normal">egress</span>
            </div>
          </div>

          {/* Cost Savings Meter */}
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-600/40 text-left">
            <div className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Cloud Cost Saved
            </div>
            <div className="text-sm font-bold text-emerald-300">
              +${savedDollars} <span className="text-[10px] text-slate-400 font-normal font-sans">($0 Edge)</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
