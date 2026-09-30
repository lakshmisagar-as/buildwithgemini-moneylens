import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Trash2, 
  Plus, 
  Target, 
  Star, 
  ShieldAlert, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function MemoryView() {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('priority');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const categoryConfig = {
    goal: { label: 'Financial Goals', icon: Target, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    priority: { label: 'Protected Priorities', icon: Star, color: 'text-amber-400', border: 'border-amber-500/30' },
    constraint: { label: 'Hard Constraints', icon: ShieldAlert, color: 'text-rose-400', border: 'border-rose-500/30' },
    future_change: { label: 'Known Future Changes', icon: Calendar, color: 'text-sky-400', border: 'border-sky-500/30' }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/preferences');
      const data = await res.json();
      setPreferences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;

    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, details }),
      });
      if (res.ok) {
        setTitle('');
        setDetails('');
        setStatusMsg('Preference saved! The Lens will strictly respect this rule in future queries.');
        setTimeout(() => setStatusMsg(''), 4000);
        fetchPreferences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (prefId) => {
    try {
      await fetch(`/api/preferences/${prefId}`, { method: 'DELETE' });
      fetchPreferences();
    } catch (err) {
      console.error(err);
    }
  };

  // Group preferences by category
  const grouped = {
    goal: preferences.filter(p => p.category === 'goal'),
    priority: preferences.filter(p => p.category === 'priority'),
    constraint: preferences.filter(p => p.category === 'constraint'),
    future_change: preferences.filter(p => p.category === 'future_change'),
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BrainCircuit className="w-5 h-5" />
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Preferences & AI Memory</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Structured preferences that personalize The Lens. When you tell the AI "Travel is important to me, don't cut travel", it saves it here and respects it across all scenarios and budget suggestions.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Add New Preference Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Teach The Lens a New Preference or Rule</span>
        </h3>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5"
          >
            <option value="goal">🎯 Goal (e.g. Save $25k for house)</option>
            <option value="priority">⭐ Priority (e.g. Don't cut travel)</option>
            <option value="constraint">🛡️ Constraint (e.g. Min $10k cash reserve)</option>
            <option value="future_change">📅 Future Change (e.g. Rent +$300 in Jan)</option>
          </select>

          <input
            type="text"
            placeholder="Title (e.g. Travel Budget Protected)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <input
            type="text"
            placeholder="Details (e.g. Never suggest cutting my vacation spending)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Save Preference</span>
          </button>
        </form>
      </div>

      {/* 4 Categorized Preference Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.entries(categoryConfig).map(([catKey, config]) => {
          const items = grouped[catKey] || [];
          const Icon = config.icon;
          return (
            <div key={catKey} className={`bg-slate-900/90 border ${config.border} rounded-2xl p-5 space-y-3 shadow-sm`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <h3 className="text-sm font-bold text-white">{config.label}</h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {items.length} rule{items.length === 1 ? '' : 's'}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No active preferences defined in this category.</p>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start justify-between group">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{item.details}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded-md transition"
                        title="Delete preference"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
