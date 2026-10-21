import React from 'react';
import { AlertOctagon, Sparkles, RotateCcw, ShieldCheck, Flame } from 'lucide-react';

interface ControlToolbarProps {
  onInjectHazard: () => void;
  onSimulateBump: () => void;
  onReset: () => void;
  isEscalated: boolean;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  onInjectHazard,
  onSimulateBump,
  onReset,
  isEscalated
}) => {
  return (
    <footer className="bg-obsidian-light/95 border-t border-slate-800 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Judge Demo Control Panel */}
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
            Interactive Pitch Controls:
          </span>

          {/* Simulate Speed Bump (Normal) */}
          <button
            onClick={onSimulateBump}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Simulate Speed Bump (Normal / $0 Egress)
          </button>

          {/* Inject Road Hazard (Escalate) */}
          <button
            onClick={onInjectHazard}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
              isEscalated
                ? 'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
                : 'bg-rose-950 hover:bg-rose-900 border border-rose-500 text-rose-200 hover:shadow-rose-500/30'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-300" />
            Inject Road Hazard (Escalate to 31B)
          </button>

          {/* Reset Stream */}
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Stream
          </button>
        </div>

        {/* Live Token/Dollar Burn Comparison */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Continuous 50Hz Cloud Egress: <span className="text-rose-400 font-bold">$38.40/day</span></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>HESTR Speculative Router: $0.14/day (96.4% Saved)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
