import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  FlaskConical,
  History,
  Calendar,
  Layers
} from 'lucide-react';
import ChatInterface from './Chat/ChatInterface';
import DetectiveSection from './DetectiveSection';
import { Doughnut } from 'react-chartjs-2';

export default function OverviewView({ 
  overviewData, 
  onNavigateToChat, 
  onNavigateToWhatIf, 
  onNavigateToTimeline 
}) {
  if (!overviewData) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading financial snapshot...
      </div>
    );
  }

  const {
    month = '2026-09',
    monthly_income = 8500.0,
    monthly_spending = 5559.47,
    monthly_savings = 2940.53,
    savings_rate = 34.6,
    budget_utilization = 97.5,
    category_breakdown = [],
    savings_goal = {}
  } = overviewData;

  const doughnutData = {
    labels: category_breakdown.slice(0, 5).map((c) => c.key),
    datasets: [
      {
        data: category_breakdown.slice(0, 5).map((c) => c.total),
        backgroundColor: [
          '#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#8b5cf6'
        ],
        borderWidth: 0,
      },
    ],
  };

  const handleDetectiveAction = (act) => {
    if (act.action === 'whatif' && onNavigateToWhatIf) {
      onNavigateToWhatIf(act.payload);
    } else if (act.action === 'timeline' && onNavigateToTimeline) {
      onNavigateToTimeline(act.payload);
    } else if (act.action === 'chat' && onNavigateToChat) {
      onNavigateToChat(act.payload);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Financial Detective Hero Hub */}
      <DetectiveSection 
        onActionClick={handleDetectiveAction}
      />

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Income */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Monthly Inflow</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold text-white font-mono">
              ${monthly_income.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">Salary</span>
          </div>
        </div>

        {/* Outflow */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Total Outflow</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold text-white font-mono">
              ${monthly_spending.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Sep 2026</span>
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Net Surplus</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold text-emerald-400 font-mono">
              +${monthly_savings.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">{savings_rate}% rate</span>
          </div>
        </div>

        {/* Goal Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Annual Goal ($25k)</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-bold text-white font-mono">
              ${(savings_goal.current_savings || 16500).toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">66% on track</span>
          </div>
        </div>
      </div>

      {/* Feature Quick Launch Cards: What-If & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* What-If Simulator Card */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-sm transition flex items-center justify-between group">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                Financial "What If?" Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              "What happens if I save $500 more each month or reduce dining by 25%?"
            </p>
          </div>
          <button
            onClick={() => onNavigateToWhatIf && onNavigateToWhatIf()}
            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold rounded-xl border border-emerald-500/20 transition shrink-0 ml-3"
          >
            Launch Simulator
          </button>
        </div>

        {/* Timeline Card */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-sm transition flex items-center justify-between group">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                9-Month Financial Timeline
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Explore month-over-month shifts, savings rate history, and vacation spending spikes.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTimeline && onNavigateToTimeline()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shrink-0 ml-3"
          >
            View Timeline
          </button>
        </div>
      </div>

      {/* Centerpiece: AI Finance Chat (Ask The Lens) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Ask The Lens</span>
          </h3>
          <span className="text-xs text-slate-400">Multi-turn context with pronoun resolution & preference awareness</span>
        </div>
        <ChatInterface isHero={true} />
      </div>

      {/* Spending Breakdown and Goal Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Doughnut */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">September Spending Mix</h4>
            <span className="text-xs text-slate-400 font-mono">${monthly_spending.toLocaleString()}</span>
          </div>
          <div className="h-48 flex items-center justify-center">
            {category_breakdown.length > 0 ? (
              <Doughnut
                data={doughnutData}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 },
                    },
                  },
                  maintainAspectRatio: false,
                  cutout: '72%',
                }}
              />
            ) : (
              <span className="text-xs text-slate-500">No data available</span>
            )}
          </div>
        </div>

        {/* Goal Detail Card */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Annual Savings Goal: $25,000</h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">66% Completed</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Target date: <strong>December 31, 2026</strong>. You have saved <strong>$16,500</strong>. At your current net surplus of <strong>${monthly_savings.toLocaleString()}/mo</strong>, you are projected to reach <strong>$25,321.59</strong>, safely surpassing your target.
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `66%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
            <span className="text-slate-400">Required monthly pace: $2,833/mo</span>
            <button
              onClick={() => onNavigateToWhatIf && onNavigateToWhatIf({ category: 'General Savings', change_type: 'fixed_amount', change_value: 500 })}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <span>Simulate +$500/mo acceleration</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
