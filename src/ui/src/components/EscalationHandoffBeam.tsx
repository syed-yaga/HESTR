import React from 'react';
import { ArrowRight, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface EscalationHandoffBeamProps {
  isEscalated: boolean;
}

export const EscalationHandoffBeam: React.FC<EscalationHandoffBeamProps> = ({ isEscalated }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center px-2 py-4 relative">
      {/* Background divider line */}
      <div className="absolute inset-y-0 w-px bg-slate-800" />

      {/* Wire Compression Badge */}
      <div className="relative z-10 flex flex-col items-center space-y-3 bg-obsidian border border-slate-800 rounded-xl p-3 shadow-2xl">
        <div className={`p-2 rounded-full border transition-all duration-300 ${
          isEscalated 
            ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse shadow-lg shadow-rose-500/40' 
            : 'bg-slate-900 border-slate-700 text-slate-400'
        }`}>
          {isEscalated ? <ShieldAlert className="w-5 h-5" /> : <Zap className="w-5 h-5 text-hud-cyan" />}
        </div>

        {/* Compression Metric Badge */}
        <div className="text-center font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Compaction</div>
          <div className="text-xs font-bold text-hud-cyan">18 KB Frame</div>
          <div className="text-[9px] text-slate-500 line-through">450 KB/min</div>
        </div>

        {/* Animated packet beam */}
        <div className="relative w-12 h-6 flex items-center justify-center overflow-hidden">
          {isEscalated ? (
            <div className="flex items-center space-x-1 animate-pulse text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <ArrowRight className="w-4 h-4 text-rose-400 animate-bounce" />
            </div>
          ) : (
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px]">GATE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
