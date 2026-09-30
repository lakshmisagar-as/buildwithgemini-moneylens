import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  HelpCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';

export default function TimelineView({ onNavigateToChat }) {
  const [timeline, setTimeline] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/timeline');
      const data = await res.json();
      setTimeline(data);
      if (data.months && data.months.length > 0) {
        const defaultIndex = data.months.length >= 2 ? data.months.length - 2 : data.months.length - 1;
        const defaultMonth = data.months[defaultIndex].month;
        setSelectedMonth(defaultMonth);
        fetchExplanation(defaultMonth);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExplanation = async (month) => {
    setExplaining(true);
    try {
      const res = await fetch(`/api/timeline/explain?month=${month}`);
      const data = await res.json();
      setExplanation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(false);
    }
  };

  const handleSelectMonth = (m) => {
    setSelectedMonth(m);
    fetchExplanation(m);
  };

  if (loading || !timeline) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading 9-Month Financial Timeline...
      </div>
    );
  }

  const selectedData = timeline.months.find(m => m.month === selectedMonth) || timeline.months[0];

  // Chart: Income vs Spending vs Savings
  const cashflowChartData = {
    labels: timeline.months.map(m => m.label),
    datasets: [
      {
        label: 'Monthly Income ($)',
        data: timeline.months.map(m => m.income),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        tension: 0.3,
        fill: false,
        borderWidth: 2
      },
      {
        label: 'Total Spending ($)',
        data: timeline.months.map(m => m.spending),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.3,
        fill: false,
        borderWidth: 2
      },
      {
        label: 'Net Savings ($)',
        data: timeline.months.map(m => m.savings),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.3,
        fill: true,
        borderWidth: 2
      }
    ]
  };

  // Savings Rate Bar Chart
  const savingsRateChartData = {
    labels: timeline.months.map(m => m.label),
    datasets: [
      {
        label: 'Savings Rate (%)',
        data: timeline.months.map(m => m.savings_rate),
        backgroundColor: timeline.months.map(m => m.month === selectedMonth ? '#10b981' : '#334155'),
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <History className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Financial Timeline & History</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track income, outflow, and savings rate trends across Jan–Sep 2026. Inspect specific months for underlying transaction causes.
          </p>
        </div>

        <button
          onClick={() => onNavigateToChat && onNavigateToChat(`Explain the financial changes in ${selectedData.label}. Why did my savings rate change?`)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Explain {selectedData.label} in The Lens</span>
        </button>
      </div>

      {/* Main Cashflow Trend Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>Cashflow History (Income vs Outflow vs Savings)</span>
          </h3>
          <span className="text-xs text-slate-400">Click any month below to inspect</span>
        </div>

        <div className="h-64">
          <Line
            data={cashflowChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 11 } } } },
              scales: {
                x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
              }
            }}
          />
        </div>
      </div>

      {/* Interactive Month Selector Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {timeline.months.map((m) => {
          const isSelected = m.month === selectedMonth;
          return (
            <button
              key={m.month}
              onClick={() => handleSelectMonth(m.month)}
              className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                isSelected 
                  ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold">{m.label}</p>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-1">{m.savings_rate}%</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">${m.spending.toLocaleString()}</p>
              {m.anomaly_note && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" title={m.anomaly_note} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Month Deep-Dive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Month KPI Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{selectedData.label} Metrics</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              {selectedData.savings_rate}% Savings Rate
            </span>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans">Monthly Income</span>
              <span className="text-slate-200 font-bold">${selectedData.income.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans">Total Outflow</span>
              <span className="text-rose-400 font-bold">${selectedData.spending.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-sans">Net Cashflow</span>
              <span className="text-emerald-400 font-bold">+${selectedData.savings.toLocaleString()}</span>
            </div>
          </div>

          {selectedData.anomaly_note && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 font-medium">{selectedData.anomaly_note}</p>
            </div>
          )}

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Outflows</h4>
            <div className="space-y-1.5">
              {selectedData.top_categories.map((c, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-800/40">
                  <span className="text-slate-300">{c.category}</span>
                  <span className="text-slate-200 font-mono font-medium">${c.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI-Powered Underlying Explanation & Shifts */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Underlying Transaction Drivers ({selectedData.label} vs Previous Month)</span>
            </h3>
            {explanation && (
              <span className={`text-xs font-bold font-mono ${explanation.difference > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {explanation.difference > 0 ? '+' : ''}${explanation.difference.toLocaleString()} ({explanation.percentage_change}%)
              </span>
            )}
          </div>

          {explaining ? (
            <div className="p-8 text-center text-xs text-slate-400">Analyzing transactions for {selectedData.label}...</div>
          ) : explanation ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Largest Category Shifts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {explanation.top_drivers.map((d, i) => (
                    <div key={i} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">{d.key}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          ${d.period1_amount.toLocaleString()} → ${d.period2_amount.toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-xs font-bold font-mono ${d.difference > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {d.difference > 0 ? '+' : ''}${d.difference.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top Transactions Behind This Month</h4>
                <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  {explanation.top_transactions.map((tx, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{tx.merchant}</p>
                        <p className="text-[11px] text-slate-400">{tx.category} • {tx.date}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-200">${tx.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
