# 💰 MoneyLens — AI-Powered Personal Finance Copilot

Built for **Build with Gemini (Track 3: Agent-First Apps)**.

MoneyLens is an intelligent personal finance copilot that empowers users to explore, understand, and optimize their finances using natural language conversations coupled with rich interactive charts, budget breakdowns, and "what-if" scenario simulations.

---

## 🌟 Key Highlights

1. **Agent Tool Reasoning (Not Just a Chatbot)**:
   - Uses **Gemini 2.5 Flash** with function calling to query an underlying financial engine.
   - Built-in tools: `get_transactions`, `get_spending_summary`, `compare_periods`, `get_budget`, `calculate_savings_projection`, `run_scenario`, and `get_user_memory`.
   - Collapsible **Agent Reasoning** badges displaying exact executed tool calls, arguments, and execution trace.

2. **Tri-Partite Financial Response Design**:
   - **Facts**: Exact verified metrics from transaction data.
   - **Analysis**: Meaningful percentage deltas, trends, and budget variances.
   - **Suggestions**: Actionable educational guidance and scenario trade-offs (explicitly framed as educational, not financial advice).

3. **Rich Interactive Visual Responses**:
   - Dynamic Bar Charts & Doughnut Charts (Chart.js).
   - Metric delta highlight cards.
   - Scenario simulation cards showing monthly and annual savings impacts.
   - Savings goal trajectory cards.
   - Interactive follow-up prompt chips that automatically trigger the next query.

4. **Long-Term Memory & User Rules**:
   - Persistent memory panel storing user financial targets and constraints (e.g., "$25,000 annual savings goal", "Never suggest cuts to rent or groceries").

5. **Realistic 9-Month Synthetic Dataset**:
   - Deterministic transactions spanning January to September 2026 (~200 records).
   - Realistic patterns: August restaurant surge ($981), July Seattle vacation ($1,850), March Apple Studio Display purchase, steady groceries, recurring subscriptions.

---

## 🚀 Quickstart

### 1. Backend (FastAPI + Gemini)
```bash
cd /config/Desktop/BuildWithGemini/moneylens
python3 -m uvicorn moneylens.backend.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend (React + Vite + Tailwind CSS)
```bash
cd /config/Desktop/BuildWithGemini/moneylens/frontend
npm run dev
```

Visit the web app at `http://localhost:5173`.
