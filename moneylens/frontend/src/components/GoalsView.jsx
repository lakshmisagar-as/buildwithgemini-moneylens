import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, CheckCircle2, ShieldCheck, DollarSign, Calendar } from 'lucide-react';

export default function GoalsView() {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoal(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!goal) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Savings Goals</h2>
          <p className="text-xs text-slate-400">Long-term wealth targets and trajectory simulations</p>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{goal.name}</h3>
              <p className="text-xs text-slate-400">Target Date: {goal.target_date} (End of 2026)</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>On Track to Complete</span>
          </span>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-slate-400">Current Progress</span>
            <span className="font-bold text-white text-base">
              ${Number(goal.current_savings).toLocaleString()} <span className="text-slate-500 text-xs">/ ${Number(goal.target_amount).toLocaleString()}</span>
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/30"
              style={{ width: `${goal.percentage_completed}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{goal.percentage_completed}% Achieved</span>
            <span>${Number(goal.remaining_amount).toLocaleString()} remaining to fund</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Target Amount</span>
            <span className="text-xl font-bold text-white">${Number(goal.target_amount).toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Full 2026 Emergency Target</span>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Current Balance</span>
            <span className="text-xl font-bold text-emerald-400">${Number(goal.current_savings).toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Saved across 9 months</span>
          </div>
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Monthly Surplus Target</span>
            <span className="text-xl font-bold text-teal-300">~${Number(goal.monthly_contribution).toLocaleString()}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Net savings rate required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
