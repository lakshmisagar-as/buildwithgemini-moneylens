import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import OverviewView from './components/OverviewView';
import ChatInterface from './components/Chat/ChatInterface';
import TransactionsView from './components/TransactionsView';
import BudgetView from './components/BudgetView';
import GoalsView from './components/GoalsView';
import MemoryView from './components/MemoryView';
import WhatIfView from './components/WhatIfView';
import TimelineView from './components/TimelineView';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState(null);
  const [preferencesCount, setPreferencesCount] = useState(4);
  const [initialScenario, setInitialScenario] = useState(null);
  const [initialChatMessage, setInitialChatMessage] = useState(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/overview?month=2026-09');
      const data = await res.json();
      setOverviewData(data);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    }
  };

  const fetchPreferencesCount = async () => {
    try {
      const res = await fetch('/api/preferences');
      const data = await res.json();
      setPreferencesCount(data.length);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchPreferencesCount();
  }, []);

  const handleNavigateToChat = (prompt) => {
    setInitialChatMessage(prompt);
    setActiveTab('chat');
  };

  const handleNavigateToWhatIf = (scenario) => {
    setInitialScenario(scenario || null);
    setActiveTab('whatif');
  };

  const handleNavigateToTimeline = () => {
    setActiveTab('timeline');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        preferenceCount={preferencesCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-slate-950/40 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Tab Views */}
          {activeTab === 'overview' && (
            <OverviewView
              overviewData={overviewData}
              onNavigateToChat={handleNavigateToChat}
              onNavigateToWhatIf={handleNavigateToWhatIf}
              onNavigateToTimeline={handleNavigateToTimeline}
            />
          )}

          {activeTab === 'whatif' && (
            <WhatIfView
              onNavigateToChat={handleNavigateToChat}
              initialScenario={initialScenario}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              onNavigateToChat={handleNavigateToChat}
            />
          )}

          {activeTab === 'chat' && (
            <div className="h-[calc(100vh-6rem)]">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">The Lens</h2>
                <p className="text-xs text-slate-400">
                  Full-screen conversational interface with automatic tool calling, pronoun resolution, and visual widgets
                </p>
              </div>
              <ChatInterface initialPrompt={initialChatMessage} />
            </div>
          )}

          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'budget' && <BudgetView />}
          {activeTab === 'goals' && <GoalsView />}
          {activeTab === 'memory' && <MemoryView />}
        </div>
      </main>
    </div>
  );
}
