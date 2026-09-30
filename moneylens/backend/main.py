from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from moneylens.backend.data.finance_engine import FinanceEngine
from moneylens.backend.agent.agent import MoneyLensAgent
from moneylens.backend.data.schema import (
    Transaction,
    CategorySummary,
    PeriodComparison,
    BudgetCategory,
    SavingsGoal,
    SavingsProjection,
    ChatRequest,
    ChatResponse,
    ScenarioParameter,
    SavedScenario,
    UserPreference
)

app = FastAPI(
    title="MoneyLens API",
    description="Backend API for MoneyLens — Personal Finance Intelligence with Gemini 2.5",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = FinanceEngine()
agent = MoneyLensAgent(finance_engine=engine)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MoneyLens", "version": "2.0.0"}

@app.get("/api/overview")
def get_overview(month: str = "2026-09"):
    spending_summary = engine.get_spending_summary(
        start_date=f"{month}-01",
        end_date=f"{month}-31",
        group_by="category"
    )
    total_spending = sum(item["total"] for item in spending_summary)
    monthly_income = 8500.0
    monthly_savings = max(0.0, monthly_income - total_spending)
    savings_rate = round((monthly_savings / monthly_income) * 100, 1) if monthly_income > 0 else 0.0

    budgets = engine.get_budget(month=month)
    total_budget = sum(b["monthly_budget"] for b in budgets)
    budget_utilization = round((total_spending / total_budget) * 100, 1) if total_budget > 0 else 0.0

    return {
        "month": month,
        "monthly_income": monthly_income,
        "monthly_spending": round(total_spending, 2),
        "monthly_savings": round(monthly_savings, 2),
        "savings_rate": savings_rate,
        "total_budget": round(total_budget, 2),
        "budget_utilization": budget_utilization,
        "category_breakdown": spending_summary,
        "savings_goal": {
            "name": "Annual Emergency & Investment Fund",
            "target_amount": 25000.0,
            "current_savings": 16500.0,
            "target_date": "2026-12-31",
            "monthly_contribution": 1800.0,
            "percentage_completed": 66.0,
            "remaining_amount": 8500.0
        }
    }

@app.get("/api/transactions")
def list_transactions(
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    merchant: Optional[str] = None,
    limit: int = 50
):
    return engine.get_transactions(
        category=category,
        start_date=start_date,
        end_date=end_date,
        merchant=merchant,
        limit=limit
    )

@app.get("/api/budgets")
def list_budgets(month: str = "2026-09"):
    return engine.get_budget(month=month)

@app.get("/api/goals")
def get_goals():
    return SavingsGoal()

# --- Feature 1: What-If Simulator Endpoints ---
class RunScenarioRequest(BaseModel):
    name: Optional[str] = "Custom Scenario"
    changes: List[Dict[str, Any]]
    duration_months: Optional[int] = 12

@app.post("/api/scenarios/run")
def run_scenario_endpoint(req: RunScenarioRequest):
    return engine.run_financial_scenario(
        changes=req.changes,
        scenario_name=req.name or "Custom Scenario",
        duration_months=req.duration_months or 12
    )

class CompareScenariosRequest(BaseModel):
    scenarios: List[Dict[str, Any]]

@app.post("/api/scenarios/compare")
def compare_scenarios_endpoint(req: CompareScenariosRequest):
    return engine.compare_scenarios(req.scenarios)

class SaveScenarioRequest(BaseModel):
    name: str
    parameters: List[Dict[str, Any]]
    result: Dict[str, Any]

@app.post("/api/scenarios/save")
def save_scenario_endpoint(req: SaveScenarioRequest):
    sc_id = engine.save_scenario(req.name, req.parameters, req.result)
    return {"status": "saved", "id": sc_id}

@app.get("/api/scenarios/saved")
def get_saved_scenarios_endpoint():
    return engine.get_saved_scenarios()

# --- Feature 2: Structured Financial Preferences / Memory Endpoints ---
@app.get("/api/preferences")
def get_preferences_endpoint():
    return engine.get_user_preferences()

class SavePreferenceRequest(BaseModel):
    category: str # goal, priority, constraint, future_change
    title: str
    details: str

@app.post("/api/preferences")
def save_preference_endpoint(req: SavePreferenceRequest):
    pref_id = engine.save_user_preference(req.category, req.title, req.details)
    return {"status": "saved", "id": pref_id}

@app.delete("/api/preferences/{pref_id}")
def delete_preference_endpoint(pref_id: str):
    success = engine.delete_user_preference(pref_id)
    return {"status": "deleted" if success else "not_found"}

# Backward compatible /api/memories
@app.get("/api/memories")
def get_memories():
    return engine.get_memories()

class MemoryCreate(BaseModel):
    key: str
    value: str

@app.post("/api/memories")
def create_memory(mem: MemoryCreate):
    mid = engine.add_memory(mem.key, mem.value)
    return {"id": mid, "key": mem.key, "value": mem.value}

# --- Feature 3: Financial Timeline Endpoints ---
@app.get("/api/timeline")
def get_timeline_endpoint():
    return engine.get_financial_timeline()

@app.get("/api/timeline/explain")
def explain_timeline_endpoint(month: str = "2026-08", previous_month: Optional[str] = None):
    return engine.explain_financial_change(month=month, previous_month=previous_month)

# --- Feature 5: Financial Detective (Find Hidden Money) ---
@app.get("/api/detective")
def get_detective_findings_endpoint():
    return engine.detect_hidden_money()

# --- Conversational AI (The Lens) ---
# Forwards to deployed Vertex AI Agent Engine (Reasoning Engine) over A2A
import uuid
import httpx
import google.auth
import google.auth.transport.requests

RE_ID = "projects/44516637274/locations/us-central1/reasoningEngines/7246194493660069888"
RE_URL = f"https://us-central1-aiplatform.googleapis.com/reasoningEngines/v1/{RE_ID}/api/a2a/the_lens"

_a2a_context_cache = {}

def _query_remote_agent_runtime(user_prompt: str, user_id: str = "default_user") -> Optional[str]:
    try:
        creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        creds.refresh(google.auth.transport.requests.Request())
        headers = {
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json"
        }
        
        ctx_id = _a2a_context_cache.get(user_id)
        msg_payload = {
            "message_id": str(uuid.uuid4()),
            "role": "user",
            "parts": [{"text": user_prompt}]
        }
        if ctx_id:
            msg_payload["context_id"] = ctx_id
            
        rpc_body = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "message/send",
            "params": {
                "message": msg_payload
            }
        }
        
        resp = httpx.post(RE_URL, headers=headers, json=rpc_body, timeout=60.0)
        if resp.status_code == 200:
            data = resp.json()
            result = data.get("result", {})
            if result.get("contextId"):
                _a2a_context_cache[user_id] = result["contextId"]
                
            text_pieces = []
            for art in result.get("artifacts", []):
                for part in art.get("parts", []):
                    if isinstance(part, dict) and part.get("text"):
                        text_pieces.append(part["text"])
                    elif isinstance(part, str):
                        text_pieces.append(part)
            if text_pieces:
                return "\n\n".join(text_pieces)
    except Exception as exc:
        print(f"[RemoteAgentRuntime Warning] {exc}")
    return None

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_copilot(req: ChatRequest):
    try:
        # First query the deployed Vertex AI Agent Engine
        remote_reply = _query_remote_agent_runtime(req.prompt)
        if remote_reply:
            return ChatResponse(
                message=remote_reply,
                facts=[f"Answered via Vertex AI Agent Runtime ({RE_ID.split('/')[-1]})"],
                analysis=["Processed deterministically by Google ADK Agent"],
                suggestions=["Ask a follow-up or run a simulation scenario!"],
                visual_blocks=[],
                suggested_follow_ups=[
                    "What if I spend 20% less on restaurants?",
                    "How much did I spend in September?",
                    "Am I on track for my savings goal?"
                ],
                tool_calls_executed=["vertex_ai_agent_runtime:the_lens"]
            )
            
        # Fallback to local agent if cloud call is unavailable
        response = agent.query(
            user_prompt=req.prompt,
            chat_history=req.history,
            conversation_state=req.conversation_state
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Serve Static Frontend in Production ---
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = "/app/frontend/dist"

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_react_app(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
