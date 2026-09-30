import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, AlertTriangle, CheckCircle, ArrowRight, DollarSign, Calendar } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function VisualBlocks({ blocks = [] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-4 my-3">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'chart_bar':
            return <BarChartBlock key={idx} title={block.title} data={block.data} />;
          case 'chart_doughnut':
            return <DoughnutChartBlock key={idx} title={block.title} data={block.data} />;
          case 'metric_card':
            return <MetricCardBlock key={idx} title={block.title} data={block.data} />;
          case 'transaction_table':
            return <TransactionTableBlock key={idx} title={block.title} data={block.data} />;
          case 'scenario_card':
            return <ScenarioCardBlock key={idx} title={block.title} data={block.data} />;
          case 'savings_projection':
            return <SavingsProjectionBlock key={idx} title={block.title} data={block.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function BarChartBlock({ title, data }) {
  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets || [
      {
        label: 'Spending ($)',
        data: data.values || [],
        backgroundColor: '#10b981',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` $${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: '#1e293b' }
      },
      y: {
        ticks: { 
          color: '#94a3b8', 
          font: { size: 10 },
          callback: (val) => `$${val}` 
        },
        grid: { color: '#1e293b' }
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
      {title && <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{title}</h4>}
      <div className="h-52 w-full">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

function DoughnutChartBlock({ title, data }) {
  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets || [
      {
        data: data.values || [],
        backgroundColor: [
          '#10b981', '#3b82f6', '#f59e0b', '#ec4899', 
          '#8b5cf6', '#06b6d4', '#64748b', '#ef4444'
        ],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } }
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
      {title && <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{title}</h4>}
      <div className="h-48 w-full flex items-center justify-center">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}

function MetricCardBlock({ title, data }) {
  const metrics = data.metrics || (data.value ? [{ label: data.label || 'Metric', value: data.value, type: data.type }] : []);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
      {title && <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">{m.label}</span>
            <span className={`text-lg font-bold ${
              m.type === 'warning' ? 'text-rose-400' : (m.type === 'success' ? 'text-emerald-400' : 'text-slate-100')
            }`}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionTableBlock({ title, data }) {
  const txs = data.transactions || [];
  if (txs.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 overflow-hidden shadow-sm">
      {title && <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{title}</h4>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Merchant</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {txs.slice(0, 6).map((tx, i) => (
              <tr key={i} className="hover:bg-slate-800/30">
                <td className="py-2.5 text-slate-400">{tx.date}</td>
                <td className="py-2.5 font-medium text-slate-200">{tx.merchant}</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {tx.category}
                  </span>
                </td>
                <td className="py-2.5 text-right font-semibold text-slate-100">
                  ${Number(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScenarioCardBlock({ title, data }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 shadow-md">
      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
        <TrendingUp className="w-4 h-4" />
        <span>{title || 'Financial Scenario Simulation'}</span>
      </div>
      <p className="text-xs text-slate-300 mb-4">{data.explanation}</p>
      
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Monthly Free Cashflow</span>
          <span className="text-base font-bold text-emerald-400">+${Number(data.monthly_savings || 0).toFixed(2)}/mo</span>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Annual Impact</span>
          <span className="text-base font-bold text-emerald-300">+${Number(data.annual_savings || 0).toLocaleString()}/yr</span>
        </div>
      </div>
    </div>
  );
}

function SavingsProjectionBlock({ title, data }) {
  const onTrack = data.on_track;
  return (
    <div className={`rounded-xl p-4 border shadow-md ${
      onTrack 
        ? 'bg-slate-900/90 border-emerald-500/40' 
        : 'bg-slate-900/90 border-amber-500/40'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {onTrack ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {title || 'Savings Goal Trajectory'}
          </span>
        </div>
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
          onTrack ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        }`}>
          {onTrack ? 'On Track' : 'Adjustment Needed'}
        </span>
      </div>

      <p className="text-xs text-slate-300 mb-3">{data.explanation}</p>

      <div className="grid grid-cols-3 gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">Target Goal</span>
          <span className="text-xs font-bold text-slate-100">${Number(data.target_amount || 25000).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Current Savings</span>
          <span className="text-xs font-bold text-slate-200">${Number(data.current_savings || 16500).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Projected Total</span>
          <span className={`text-xs font-bold ${onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
            ${Number(data.projected_savings || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
