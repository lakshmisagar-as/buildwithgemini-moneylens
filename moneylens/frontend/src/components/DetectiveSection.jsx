import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function DetectiveSection({ onActionClick, onOpenAll }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/detective');
      const data = await res.json();
      setFindings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badge) => {
    if (badge.includes('SAVINGS')) return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
    if (badge.includes('CHANGE') || badge.includes('ANOMALY')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    return <Target className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Search className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">MoneyLens Detective: Find Hidden Money</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {findings.length} Actionable Findings
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proactive analysis of 9-month transactions, subscriptions, spending spikes, and savings goals.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFindings}
          className="self-start sm:self-auto text-xs px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
        >
          Re-scan Transactions
        </button>
      </div>

      {/* Findings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {loading ? (
          <div className="col-span-2 py-10 text-center text-xs text-slate-400">
            Scanning 9 months of financial records for anomalies & opportunities...
          </div>
        ) : (
          findings.map((f) => {
            const isExpanded = expandedId === f.id;
            return (
              <div
                key={f.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between transition group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-1.5">
                      {getBadgeIcon(f.badge)}
                      <span>{f.badge}</span>
                    </span>
                    {f.potential_annual_savings > 0 && (
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +${f.potential_annual_savings.toLocaleString()}/yr
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                    {f.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {f.summary}
                  </p>

                  {/* Why did you flag this evidence collapse */}
                  <div className="mt-3 pt-2.5 border-t border-slate-900">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : f.id)}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center space-x-1 font-medium transition"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>{isExpanded ? 'Hide Evidence' : 'Why did you flag this?'}</span>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <p className="font-semibold text-emerald-400">Detective Evidence:</p>
                        <p>{f.evidence}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-900">
                  {f.suggested_actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => onActionClick && onActionClick(act)}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-semibold border border-emerald-500/20 transition flex items-center space-x-1"
                    >
                      <span>{act.label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
