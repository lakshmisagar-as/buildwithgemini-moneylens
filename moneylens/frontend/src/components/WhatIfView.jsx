import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Target, 
  ArrowRight,
  Sliders,
  Layers,
  PieChart,
  DollarSign
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';

export default function WhatIfView({ onNavigateToChat, initialScenario = null }) {
  const [changes, setChanges] = useState(
    initialScenario 
      ? [initialScenario] 
      : [{ category: 'Restaurants', change_type: 'percentage', change_value: -25, frequency: 'monthly' }]
  );
  const [scenarioName, setScenarioName] = useState(initialScenario ? `Reduce ${initialScenario.category}` : 'Reduce Restaurant Spending');
  const [naturalQuery, setNaturalQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [comparisonList, setComparisonList] = useState([]);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick preset templates
  const presets = [
    { label: 'Cut Dining 25%', changes: [{ category: 'Restaurants', change_type: 'percentage', change_value: -25, frequency: 'monthly' }] },
    { label: 'Save Extra $500/mo', changes: [{ category: 'General Savings', change_type: 'fixed_amount', change_value: 500, frequency: 'monthly' }] },
    { label: 'Salary +10%', changes: [{ category: 'Salary', change_type: 'percentage', change_value: 10, frequency: 'monthly' }] },
    { label: 'Stop Streaming 50%', changes: [{ category: 'Subscriptions', change_type: 'percentage', change_value: -50, frequency: 'monthly' }] },
    { label: 'Rent Increases $300', changes: [{ category: 'Housing', change_type: 'fixed_amount', change_value: -300, frequency: 'monthly' }] },
    { label: 'Vacation Trip (-$3k)', changes: [{ category: 'Travel', change_type: 'one_time', change_value: -3000, frequency: 'one_time' }] }
  ];

  const runSimulation = async (scenarioChanges = changes) => {
    setLoading(true);
    try {
      const res = await fetch('/api/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioName,
          changes: scenarioChanges
        })
      });
      const data = await res.json();
      setResult(data);

      // Auto update comparison matrix with Baseline vs This Scenario
      const compRes = await fetch('/api/scenarios/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarios: [
            { name: 'Baseline (Current)', changes: [] },
            { name: scenarioName, changes: scenarioChanges },
            { name: 'Aggressive (+50% savings)', changes: [{ category: 'General Savings', change_type: 'fixed_amount', change_value: 800 }] }
          ]
        })
      });
      const compData = await compRes.json();
      setComparisonList(compData);
    } catch (err) {
      console.error('Error running scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSaved = async () => {
    try {
      const res = await fetch('/api/scenarios/saved');
      const data = await res.json();
      setSavedScenarios(data);
    } catch (err) {
      console.error('Error loading saved scenarios:', err);
    }
  };

  useEffect(() => {
    runSimulation();
    loadSaved();
  }, []);

  const handleAddChange = () => {
    setChanges([...changes, { category: 'Shopping', change_type: 'percentage', change_value: -20, frequency: 'monthly' }]);
  };

  const handleRemoveChange = (idx) => {
    const updated = changes.filter((_, i) => i !== idx);
    setChanges(updated.length > 0 ? updated : [{ category: 'Restaurants', change_type: 'percentage', change_value: -20, frequency: 'monthly' }]);
  };

  const handleUpdateChange = (idx, field, val) => {
    const updated = [...changes];
    updated[idx][field] = val;
    setChanges(updated);
  };

  const handleSaveScenario = async () => {
    if (!result) return;
    try {
      await fetch('/api/scenarios/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioName,
          parameters: changes,
          result: result
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadSaved();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNaturalSubmit = (e) => {
    e.preventDefault();
    if (!naturalQuery.trim()) return;
    const q = naturalQuery.toLowerCase();
    
    // Parse common natural expressions
    let parsed = [];
    if (q.includes('restaurant') && (q.includes('25') || q.includes('20') || q.includes('30'))) {
      const num = q.includes('25') ? -25 : (q.includes('20') ? -20 : -30);
      parsed.push({ category: 'Restaurants', change_type: 'percentage', change_value: num, frequency: 'monthly' });
    } else if (q.includes('save') && (q.includes('500') || q.includes('$500'))) {
      parsed.push({ category: 'General Savings', change_type: 'fixed_amount', change_value: 500, frequency: 'monthly' });
    } else if (q.includes('salary') && q.includes('10')) {
      parsed.push({ category: 'Salary', change_type: 'percentage', change_value: 10, frequency: 'monthly' });
    } else if (q.includes('rent') && q.includes('300')) {
      parsed.push({ category: 'Housing', change_type: 'fixed_amount', change_value: -300, frequency: 'monthly' });
    } else if (q.includes('vacation')) {
      parsed.push({ category: 'Travel', change_type: 'one_time', change_value: -3000, frequency: 'one_time' });
    } else if (q.includes('subscription') || q.includes('netflix')) {
      parsed.push({ category: 'Subscriptions', change_type: 'percentage', change_value: -50, frequency: 'monthly' });
    } else {
      parsed.push({ category: 'Restaurants', change_type: 'percentage', change_value: -20, frequency: 'monthly' });
    }

    setChanges(parsed);
    setScenarioName(naturalQuery);
    runSimulation(parsed);
    setNaturalQuery('');
  };

  // Comparison Bar Chart Data
  const chartData = {
    labels: comparisonList.map(c => c.scenario_name),
    datasets: [
      {
        label: 'Monthly Savings ($/mo)',
        data: comparisonList.map(c => c.monthly_savings),
        backgroundColor: '#10b981',
        borderRadius: 6
      },
      {
        label: 'Monthly Spending ($/mo)',
        data: comparisonList.map(c => c.monthly_spending),
        backgroundColor: '#64748b',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Financial "What If?" Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate financial scenarios deterministically against your actual 9-month transaction history and $25,000 savings goal.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSaveScenario}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccess ? 'Saved to Scenarios!' : 'Save Scenario'}</span>
          </button>
          <button
            onClick={() => onNavigateToChat && onNavigateToChat(`What if I ${scenarioName.toLowerCase()}? Would that get me to my $25,000 savings goal?`)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask The Lens About This</span>
          </button>
        </div>
      </div>

      {/* Natural Language Scenario Prompt Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Describe Any Financial Scenario in Natural Language</span>
        </label>
        <form onSubmit={handleNaturalSubmit} className="flex gap-2">
          <input
            type="text"
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            placeholder="e.g. What if I save an extra $500 every month? or What if I spend 25% less on restaurants?"
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shrink-0"
          >
            <span>Simulate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Quick presets:</span>
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setChanges(p.changes);
                setScenarioName(p.label);
                runSimulation(p.changes);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chained Scenario Parameters Editor */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Chained Scenario Adjustments</h3>
          </div>
          <button
            onClick={handleAddChange}
            className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Adjustment</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {changes.map((ch, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-xs font-mono text-slate-400 w-5">#{idx + 1}</span>
              
              <select
                value={ch.category || 'Restaurants'}
                onChange={(e) => handleUpdateChange(idx, 'category', e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5"
              >
                <option value="Restaurants">Restaurants</option>
                <option value="Shopping">Shopping</option>
                <option value="Travel">Travel</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Housing">Housing / Rent</option>
                <option value="Salary">Income / Salary</option>
                <option value="General Savings">General Savings</option>
              </select>

              <select
                value={ch.change_type}
                onChange={(e) => handleUpdateChange(idx, 'change_type', e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount ($)</option>
                <option value="one_time">One-Time ($)</option>
              </select>

              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={ch.change_value}
                  onChange={(e) => handleUpdateChange(idx, 'change_value', parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 text-right font-mono"
                />
                <span className="text-xs text-slate-400">
                  {ch.change_type === 'percentage' ? '%' : '$'}
                </span>
              </div>

              <select
                value={ch.frequency}
                onChange={(e) => handleUpdateChange(idx, 'frequency', e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5"
              >
                <option value="monthly">Monthly</option>
                <option value="one_time">One-Time</option>
              </select>

              {changes.length > 1 && (
                <button
                  onClick={() => handleRemoveChange(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => runSimulation(changes)}
            disabled={loading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
          >
            {loading ? 'Recalculating...' : 'Apply Adjustments'}
          </button>
        </div>
      </div>

      {/* Main Simulation Result Cards (Current vs What-If) */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Baseline Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Baseline</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">Sep 2026</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-slate-400">Monthly Spending</p>
                <p className="text-xl font-bold text-slate-200 font-mono">${result.current_monthly_spending.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Monthly Savings</p>
                <p className="text-xl font-bold text-slate-200 font-mono">${result.current_monthly_savings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Annual Savings</p>
                <p className="text-xl font-bold text-slate-200 font-mono">${result.current_annual_savings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* What-If Projected Card */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">What-If Simulation</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Projected</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-slate-400">Simulated Spending</p>
                <p className="text-xl font-bold text-white font-mono">${result.simulated_monthly_spending.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Simulated Monthly Savings</p>
                <p className="text-xl font-bold text-emerald-400 font-mono">${result.simulated_monthly_savings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Simulated Annual Savings</p>
                <p className="text-xl font-bold text-emerald-400 font-mono">${result.simulated_annual_savings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Net Impact & Goal Acceleration Card */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Simulated Impact</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-slate-400">Monthly Cashflow Delta</p>
                <p className={`text-2xl font-black font-mono ${result.monthly_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.monthly_impact >= 0 ? '+' : ''}${result.monthly_impact.toLocaleString()}/mo
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Annual Savings Delta</p>
                <p className={`text-xl font-bold font-mono ${result.annual_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.annual_impact >= 0 ? '+' : ''}${result.annual_impact.toLocaleString()}/yr
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-300 font-medium">
                  🎯 $25,000 Target: {result.months_saved > 0 ? `Reached ~${result.months_saved} month(s) earlier!` : 'Maintains current schedule.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Scenario Comparison Matrix */}
      {comparisonList.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Scenario Comparison Matrix</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Scenario</th>
                  <th className="p-3 font-semibold text-right">Monthly Spending</th>
                  <th className="p-3 font-semibold text-right">Monthly Savings</th>
                  <th className="p-3 font-semibold text-right">Annual Savings</th>
                  <th className="p-3 font-semibold text-right">Monthly Impact</th>
                  <th className="p-3 font-semibold text-right">Dec 2026 Year-End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {comparisonList.map((item, idx) => (
                  <tr key={idx} className={idx === 1 ? 'bg-emerald-500/5' : 'hover:bg-slate-800/40'}>
                    <td className="p-3 font-sans font-medium text-slate-200">{item.scenario_name}</td>
                    <td className="p-3 text-right text-slate-400">${item.monthly_spending.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">${item.monthly_savings.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-200">${item.annual_savings.toLocaleString()}</td>
                    <td className={`p-3 text-right font-bold ${item.monthly_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.monthly_impact >= 0 ? '+' : ''}${item.monthly_impact.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-slate-200">${item.projected_year_end.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Side-by-side Visual Bar Chart */}
          <div className="h-64 mt-4 pt-4 border-t border-slate-800">
            <Bar 
              data={chartData} 
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
      )}

      {/* Saved Scenarios Library */}
      {savedScenarios.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Saved Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedScenarios.map((sc) => (
              <div key={sc.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{sc.name}</h4>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    +${sc.result.monthly_impact}/mo (${sc.result.annual_impact > 0 ? '+' : ''}${sc.result.annual_impact}/yr)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setChanges(sc.parameters);
                    setScenarioName(sc.name);
                    runSimulation(sc.parameters);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
                >
                  Reload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
