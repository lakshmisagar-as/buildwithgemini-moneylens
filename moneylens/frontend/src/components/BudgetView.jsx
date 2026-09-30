import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, PieChart, ShieldAlert } from 'lucide-react';

export default function BudgetView() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets?month=2026-09');
      const data = await res.json();
      setBudgets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = budgets.reduce((acc, b) => acc + b.monthly_budget, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_current_month, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Budget Tracker</h2>
          <p className="text-xs text-slate-400">Monthly budget thresholds vs. actual expenditure (September 2026)</p>
        </div>
      </div>

      {/* Aggregate Top Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Monthly Budget</span>
            <div className="text-2xl font-bold text-white mt-1">
              ${totalSpent.toLocaleString()} <span className="text-sm font-normal text-slate-500">/ ${totalBudget.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              totalPct > 100 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {totalPct}% Allocated Spent
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalPct > 100 
                ? 'bg-rose-500 shadow-sm shadow-rose-500/50' 
                : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
            }`}
            style={{ width: `${Math.min(100, totalPct)}%` }}
          />
        </div>
      </div>

      {/* Per Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const isOver = b.status === 'over_budget';
          const isNear = b.status === 'near_budget';

          return (
            <div 
              key={b.category} 
              className={`rounded-2xl p-5 border transition-all ${
                isOver 
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-sm' 
                  : (isNear ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/80 border-slate-800')
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-slate-100">{b.category}</span>
                {isOver ? (
                  <span className="flex items-center space-x-1 text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Over Budget</span>
                  </span>
                ) : isNear ? (
                  <span className="flex items-center space-x-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Near Cap</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3" />
                    <span>Healthy</span>
                  </span>
                )}
              </div>

              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xl font-bold text-white">${b.spent_current_month.toFixed(2)}</span>
                <span className="text-xs text-slate-400 font-medium">Budget: ${b.monthly_budget.toFixed(2)}</span>
              </div>

              {/* Individual progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-3 border border-slate-800">
                <div
                  className={`h-full rounded-full ${
                    isOver ? 'bg-rose-500' : (isNear ? 'bg-amber-400' : 'bg-emerald-400')
                  }`}
                  style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>{b.percentage_used}% used</span>
                <span className={b.remaining < 0 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                  {b.remaining < 0 ? `-$${Math.abs(b.remaining).toFixed(2)} over` : `$${b.remaining.toFixed(2)} left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
