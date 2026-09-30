import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatInterface({ isHero = false, onMessageSent, initialPrompt = null }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm The Lens, your personal finance intelligence engine. I have access to your last 9 months of transactions, budgets, and savings goals. Ask me anything about your finances!",
      payload: {
        message: "Hello! I'm The Lens, your personal finance intelligence engine. I can query your actual transactions, compare monthly spending, run savings scenarios, and analyze your $25,000 annual goal.",
        suggested_follow_ups: [
          "Why did I spend more this month?",
          "How much did I spend on restaurants in August?",
          "Where can I save $500 a month?",
          "Am I on track to save $25,000?"
        ]
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: queryText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.payload?.message || m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryText, history })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botMsg = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        payload: data
      };

      setMessages((prev) => [...prev, botMsg]);
      if (onMessageSent) onMessageSent(botMsg);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: "I had trouble connecting to the financial engine. Please check if the backend is running.",
          payload: { message: "Error communicating with The Lens: " + err.message }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${
      isHero ? 'h-[540px]' : 'h-full'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">The Lens</h3>
            <p className="text-[11px] text-slate-400">Agent tool execution & financial analysis</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          Ready to query
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-2">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            onSelectFollowUp={(q) => handleSend(q)} 
          />
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs py-3 px-4 bg-slate-900/40 rounded-xl border border-slate-800/80 w-fit">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>MoneyLens is analyzing your financial records & running tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prominent Input Box */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your finances…"
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 rounded-xl px-4 py-3.5 pr-14 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 p-2 rounded-lg transition-all shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
