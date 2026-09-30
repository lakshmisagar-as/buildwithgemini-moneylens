import React from 'react';
import { User, Sparkles, CheckCircle2, TrendingUp, Lightbulb } from 'lucide-react';
import VisualBlocks from './VisualBlocks';
import ToolTracesBadge from './ToolTracesBadge';

// Simple markdown parser for bold, italics, and line breaks
function renderFormattedMessage(text) {
  if (!text) return null;
  
  // Split by line breaks first
  const lines = text.split('\n');
  
  return lines.map((line, lineIdx) => {
    // Parse **bold** markers
    const parts = line.split(/(\*\*.*?\*\*)/g);
    
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return (
              <strong key={partIdx} className="font-semibold text-emerald-300">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export default function MessageBubble({ message, onSelectFollowUp }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start max-w-xl space-x-2">
          <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm text-sm">
            {message.content}
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant response
  const payload = message.payload || {};
  const hasStructured = payload.facts || payload.analysis || payload.suggestions;

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start max-w-3xl space-x-3 w-full">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Agent Reasoning Badge */}
          {payload.tool_traces && payload.tool_traces.length > 0 && (
            <ToolTracesBadge traces={payload.tool_traces} />
          )}

          {/* Main Conversational Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-5 shadow-sm text-slate-200">
            {/* Primary message */}
            <div className="text-sm font-medium text-slate-100 leading-relaxed">
              {renderFormattedMessage(payload.message || message.content)}
            </div>

            {/* Suggestions Section */}
            {payload.suggestions && payload.suggestions.length > 0 && (
              <div className="mt-2 mb-2 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40">
                <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase flex items-center space-x-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Actionable Suggestions</span>
                </span>
                <ul className="space-y-1 text-xs text-emerald-200/90">
                  {payload.suggestions.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Visual Blocks (Charts, Tables, Scenarios) */}
            {payload.visual_blocks && payload.visual_blocks.length > 0 && (
              <VisualBlocks blocks={payload.visual_blocks} />
            )}
          </div>

          {/* Follow-up question pills */}
          {payload.suggested_follow_ups && payload.suggested_follow_ups.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] text-slate-500 font-medium">Suggested follow-ups:</span>
              {payload.suggested_follow_ups.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectFollowUp && onSelectFollowUp(q)}
                  className="text-xs bg-slate-900 hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 px-3 py-1 rounded-full transition-all text-left"
                >
                  {q} →
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
