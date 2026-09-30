import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function ToolTracesBadge({ traces = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!traces || traces.length === 0) return null;

  return (
    <div className="my-2 border border-emerald-950/80 bg-slate-950/60 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono text-emerald-400/90 hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-[11px] text-slate-300">Agent Reasoning:</span>
          <span>{traces.length} tool{traces.length > 1 ? 's' : ''} invoked</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400">
          <span className="text-[10px] text-slate-500">{isOpen ? 'Hide trace' : 'View trace'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 bg-slate-950 border-t border-slate-900 space-y-2 font-mono text-xs">
          {traces.map((trace, idx) => (
            <div key={idx} className="bg-slate-900/80 rounded p-2 border border-slate-800">
              <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{trace.tool}()</span>
                </span>
                <span className="text-[10px] text-slate-400">Success</span>
              </div>
              {trace.arguments && Object.keys(trace.arguments).length > 0 && (
                <div className="text-[11px] text-slate-400 bg-slate-950/70 p-1.5 rounded mt-1 overflow-x-auto">
                  <span className="text-slate-500">Args: </span>
                  {JSON.stringify(trace.arguments, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
