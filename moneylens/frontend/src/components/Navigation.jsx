import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Receipt, 
  PieChart, 
  Target, 
  BrainCircuit, 
  TrendingUp,
  FlaskConical,
  History,
  Search,
  User
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, preferenceCount = 4 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'whatif', label: 'What If?', icon: FlaskConical, badge: 'Simulator' },
    { id: 'timeline', label: 'Timeline', icon: History, badge: '9 Mos' },
    { id: 'chat', label: 'The Lens', icon: Bot, badge: 'AI Agent' },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budget', label: 'Budget Tracker', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'memory', label: 'Financial Preferences', icon: BrainCircuit, badge: `${preferenceCount}` },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
              MoneyLens
            </h1>
            <p className="text-xs text-slate-400 font-medium">The Lens</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account status */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">LS</p>
            <p className="text-[10px] text-emerald-400 font-mono">Demo Account • 9 Mos</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
