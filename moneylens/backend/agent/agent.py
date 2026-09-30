import os
import json
import re
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types
from moneylens.backend.data.finance_engine import FinanceEngine
from moneylens.backend.data.schema import (
    ChatResponse,
    VisualBlock,
    ToolTrace,
    ConversationState,
    ScenarioParameter
)

if "GOOGLE_GENAI_USE_VERTEXAI" not in os.environ and "GEMINI_API_KEY" not in os.environ:
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
    os.environ["GOOGLE_CLOUD_PROJECT"] = "qwiklabs-gcp-03-bffae58b5c9d"
    os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"

class MoneyLensAgent:
    def __init__(self, finance_engine: Optional[FinanceEngine] = None):
        self.engine = finance_engine or FinanceEngine()
        self.client = genai.Client()
        self.model_name = "gemini-2.5-flash"
        self._register_tools()

    def _register_tools(self):
        self.tool_traces_log = []

        def get_transactions(
            start_date: Optional[str] = None,
            end_date: Optional[str] = None,
            category: Optional[str] = None,
            merchant: Optional[str] = None,
            min_amount: Optional[float] = None,
            max_amount: Optional[float] = None,
            limit: int = 10,
            tx_type: Optional[str] = "expense"
        ) -> str:
            """Query individual transactions sorted by amount descending with optional filters (category, merchant, min/max amount, dates)."""
            self.tool_traces_log.append(ToolTrace(
                tool="get_transactions",
                arguments={"category": category, "merchant": merchant, "limit": limit}
            ))
            res = self.engine.get_transactions(
                start_date=start_date,
                end_date=end_date,
                category=category,
                merchant=merchant,
                min_amount=min_amount,
                max_amount=max_amount,
                limit=limit,
                tx_type=tx_type
            )
            return json.dumps(res)

        def get_spending_summary(
            start_date: Optional[str] = None,
            end_date: Optional[str] = None,
            group_by: str = "category"
        ) -> str:
            """Get total spending aggregated by category, merchant, or month for a given date range."""
            self.tool_traces_log.append(ToolTrace(
                tool="get_spending_summary",
                arguments={"start_date": start_date, "end_date": end_date, "group_by": group_by}
            ))
            res = self.engine.get_spending_summary(start_date=start_date, end_date=end_date, group_by=group_by)
            return json.dumps(res)

        def compare_periods(
            period1: Optional[str] = "2026-08",
            period2: Optional[str] = "2026-09",
            group_by: str = "category"
        ) -> str:
            """Compare total and grouped spending between two periods. Period1 is baseline (e.g. '2026-08') and Period2 is comparison (e.g. '2026-09')."""
            p1 = period1 or "2026-08"
            p2 = period2 or "2026-09"
            self.tool_traces_log.append(ToolTrace(
                tool="compare_periods",
                arguments={"period1": p1, "period2": p2, "group_by": group_by}
            ))
            res = self.engine.compare_periods(period1=p1, period2=p2, group_by=group_by)
            return json.dumps(res)

        def get_budget(month: Optional[str] = "2026-09") -> str:
            """Retrieve the user's monthly budget allocations, actual spending, and utilization percentages."""
            m = month or "2026-09"
            self.tool_traces_log.append(ToolTrace(
                tool="get_budget",
                arguments={"month": m}
            ))
            res = self.engine.get_budget(month=m)
            return json.dumps(res)

        def calculate_savings_projection(
            target_amount: float = 25000.0,
            target_date: str = "2026-12-31"
        ) -> str:
            """Analyze savings trajectories, required monthly savings, and determine whether the user is on track to reach a target savings goal (e.g. $25,000 by 2026-12-31). Automatically queries actual user savings and monthly cashflow."""
            self.tool_traces_log.append(ToolTrace(
                tool="calculate_savings_projection",
                arguments={"target_amount": target_amount, "target_date": target_date}
            ))
            res = self.engine.calculate_savings_projection(
                target_amount=target_amount,
                target_date=target_date
            )
            return json.dumps(res)

        def run_financial_scenario(
            category: Optional[str] = None,
            change_type: str = "percentage",
            change_value: float = -20.0,
            frequency: str = "monthly",
            duration_months: int = 12
        ) -> str:
            """Model the projected monthly, annual, and savings goal impact of any financial change (e.g., category: 'Restaurants', change_type: 'percentage', change_value: -25.0; or category: 'Salary', change_value: 10.0; or category: 'General Savings', change_type: 'fixed_amount', change_value: 500.0). Calculations are completely deterministic."""
            self.tool_traces_log.append(ToolTrace(
                tool="run_financial_scenario",
                arguments={"category": category, "change_type": change_type, "change_value": change_value}
            ))
            changes = [{
                "category": category,
                "change_type": change_type,
                "change_value": change_value,
                "frequency": frequency
            }]
            res = self.engine.run_financial_scenario(changes=changes, duration_months=duration_months)
            return json.dumps(res)

        def compare_scenarios(
            scenario_a_category: str = "Restaurants",
            scenario_a_pct: float = -20.0,
            scenario_b_category: str = "Restaurants",
            scenario_b_pct: float = -35.0
        ) -> str:
            """Compares multiple financial what-if scenarios side-by-side with baseline metrics."""
            self.tool_traces_log.append(ToolTrace(
                tool="compare_scenarios",
                arguments={"scenario_a": f"{scenario_a_category} {scenario_a_pct}%", "scenario_b": f"{scenario_b_category} {scenario_b_pct}%"}
            ))
            scenarios = [
                {"name": f"Scenario A: {scenario_a_category} ({scenario_a_pct}%)", "changes": [{"category": scenario_a_category, "change_type": "percentage", "change_value": scenario_a_pct}]},
                {"name": f"Scenario B: {scenario_b_category} ({scenario_b_pct}%)", "changes": [{"category": scenario_b_category, "change_type": "percentage", "change_value": scenario_b_pct}]}
            ]
            res = self.engine.compare_scenarios(scenarios)
            return json.dumps(res)

        def get_financial_timeline() -> str:
            """Retrieve the user's complete 9-month financial timeline history (income, spending, savings, savings rate, and category shifts for each month)."""
            self.tool_traces_log.append(ToolTrace(
                tool="get_financial_timeline",
                arguments={}
            ))
            res = self.engine.get_financial_timeline()
            return json.dumps(res)

        def explain_financial_change(month: str, previous_month: Optional[str] = None) -> str:
            """Retrieve deterministic transaction and category shift data explaining why a month's spending or savings rate changed."""
            self.tool_traces_log.append(ToolTrace(
                tool="explain_financial_change",
                arguments={"month": month, "previous_month": previous_month}
            ))
            res = self.engine.explain_financial_change(month=month, previous_month=previous_month)
            return json.dumps(res)

        def get_user_preferences() -> str:
            """Retrieve user financial preferences, goals, priorities, constraints, and known future changes."""
            self.tool_traces_log.append(ToolTrace(
                tool="get_user_preferences",
                arguments={}
            ))
            res = self.engine.get_user_preferences()
            return json.dumps(res)

        def save_user_preference(category: str, title: str, details: str) -> str:
            """Store a user-approved financial preference (categories: 'goal', 'priority', 'constraint', 'future_change')."""
            self.tool_traces_log.append(ToolTrace(
                tool="save_user_preference",
                arguments={"category": category, "title": title}
            ))
            res = self.engine.save_user_preference(category=category, title=title, details=details)
            return json.dumps({"status": "saved", "id": res})

        def detect_hidden_money() -> str:
            """Analyze user financial history to detect high-value savings opportunities, unnecessary subscriptions, budget leaks, and goal buffers."""
            self.tool_traces_log.append(ToolTrace(
                tool="detect_hidden_money",
                arguments={}
            ))
            res = self.engine.detect_hidden_money()
            return json.dumps(res)

        self.tool_functions = [
            get_transactions,
            get_spending_summary,
            compare_periods,
            get_budget,
            calculate_savings_projection,
            run_financial_scenario,
            compare_scenarios,
            get_financial_timeline,
            explain_financial_change,
            get_user_preferences,
            save_user_preference,
            detect_hidden_money
        ]

    def query(
        self,
        user_prompt: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        conversation_state: Optional[ConversationState] = None
    ) -> ChatResponse:
        self.tool_traces_log = []

        # Fetch active user preferences to inject into prompt
        user_prefs = self.engine.get_user_preferences()
        prefs_summary = "\n".join([f"- [{p['category'].upper()}] {p['title']}: {p['details']}" for p in user_prefs if p.get("is_active", True)])

        # Construct structured context description
        state_desc = ""
        if conversation_state:
            state_desc = f"""
CONVERSATIONAL CONTEXT STATE:
- Active Subject: {conversation_state.active_subject or 'None'}
- Current Period: {conversation_state.current_period or '2026-09'}
- Comparison Period: {conversation_state.comparison_period or '2026-08'}
- Active Metric: {conversation_state.active_metric or 'spending'}
- Active Scenario: {json.dumps(conversation_state.active_scenario) if conversation_state.active_scenario else 'None'}
- Relevant Goal: {conversation_state.active_goal or '$25,000 Annual Savings Goal'}

PRONOUN RESOLUTION RULES:
- If user says 'that', 'it', 'them', resolve it to the Active Subject (e.g. if subject is 'Restaurants', 'How much was that in July?' means Restaurant spending in July 2026).
- If user asks 'Why did it increase?', look at the Active Subject's difference between Comparison Period and Current Period.
- If user asks 'What if I reduce it by 20%?', run a scenario on the Active Subject!
- If user asks 'Would that get me to my savings goal?', evaluate the active scenario against the $25,000 goal!
"""

        system_instruction = f"""You are The Lens, the intelligent personal finance AI engine of MoneyLens. You are encouraging, numbers-first, and meticulous.
Current Date Context: September 30, 2026. The demo dataset covers Jan 2026 - Sep 2026.
The user's monthly income is $8,500. Current month is September 2026 ("2026-09"). Previous month is August 2026 ("2026-08").

ACTIVE USER PREFERENCES & CONSTRAINTS (MUST RESPECT):
{prefs_summary}

IMPORTANT CONSTRAINTS ENFORCEMENT:
- If a user preference states that a category (e.g. Travel) is a priority and NOT to suggest cutting it, EXCLUDE it when recommending budget cuts or savings optimizations. Explicitly state to the user: "I excluded Travel because you marked it as a priority in your financial preferences."

{state_desc}

TOOL USAGE RULES:
1. When asked "What if" or financial scenarios (e.g., "What if I cut restaurants by 25%?", "What if I save an extra $500/mo?"), CALL `run_financial_scenario()`. Never invent numbers—rely completely on the tool's deterministic output.
2. When asked about savings goals (e.g. "Am I on track to save $25,000?", "Can I reach my goal?"), CALL `calculate_savings_projection(target_amount=25000.0, target_date="2026-12-31")`.
3. When asked to compare months or why spending was higher, CALL `compare_periods(period1="2026-08", period2="2026-09")`.
4. When asked for timeline, historical trends, or savings rate over time, CALL `get_financial_timeline()`.
5. When asked to explain a specific month change (e.g., June or July spike), CALL `explain_financial_change(month=...)`.
6. When asked about subscriptions, CALL `get_transactions(category="Subscriptions", limit=10)`.
7. When the user shares a new preference or rule (e.g., "I'm saving for a house" or "My rent increases to $3,000 in January"), CALL `save_user_preference()`.
8. When asked to find hidden money or opportunities, CALL `detect_hidden_money()`.

OUTPUT FORMAT (CRITICAL):
Your final response turn must be valid JSON:
{{
  "message": "Conversational summary explaining findings clearly with numbers.",
  "facts": ["Fact 1 with verified numbers", "Fact 2"],
  "analysis": ["Analysis insight 1", "Analysis insight 2"],
  "suggestions": ["Actionable educational suggestion 1"],
  "visual_blocks": [
    {{
      "type": "metric_card | chart_bar | chart_doughnut | chart_line | transaction_table | scenario_card | savings_projection | comparison_matrix",
      "title": "Widget Title",
      "data": {{ ... }}
    }}
  ],
  "suggested_follow_ups": ["Follow up 1", "Follow up 2", "Follow up 3"],
  "conversation_state": {{
    "active_subject": "e.g. Restaurants or Travel or Subscriptions",
    "current_period": "2026-09",
    "comparison_period": "2026-08",
    "active_metric": "spending",
    "active_scenario": {{ "category": "...", "change_value": -25.0 }},
    "active_goal": "$25,000 Annual Savings Goal"
  }}
}}

Wrap the JSON in ```json ... ``` blocks.
"""

        chat = self.client.chats.create(
            model=self.model_name,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=self.tool_functions,
                temperature=0.1,
            )
        )

        if chat_history:
            for msg in chat_history[-6:]:
                role = "user" if msg.get("role") == "user" else "model"
                try:
                    chat.send_message(msg.get("content", ""))
                except Exception:
                    pass

        raw_text = ""
        try:
            response = chat.send_message(user_prompt)
            history = chat.get_history()
            for msg in reversed(history):
                if msg.role == "model":
                    for part in msg.parts:
                        if hasattr(part, "text") and part.text:
                            raw_text = part.text
                            break
                    if raw_text:
                        break

            if not raw_text.strip():
                followup = chat.send_message("Please output the financial analysis in the specified JSON format.")
                raw_text = followup.text or ""
        except Exception as e:
            raw_text = f"Error generating response: {str(e)}"

        return self._parse_agent_response(raw_text, self.tool_traces_log, user_prompt, conversation_state)

    def _parse_agent_response(
        self,
        raw_text: str,
        tool_traces: List[ToolTrace],
        user_prompt: str,
        prev_state: Optional[ConversationState] = None
    ) -> ChatResponse:
        cleaned = raw_text.strip()
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group(1)
        elif cleaned.startswith("{") and cleaned.endswith("}"):
            pass
        else:
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                cleaned = cleaned[first_brace:last_brace+1]

        tool_names = [t.tool for t in tool_traces]

        try:
            data = json.loads(cleaned)
            visual_blocks = [
                VisualBlock(type=b.get("type", "metric_card"), title=b.get("title"), data=b.get("data", {}))
                for b in data.get("visual_blocks", [])
            ]

            # Parse conversation state from response or preserve previous
            state_dict = data.get("conversation_state")
            if state_dict:
                updated_state = ConversationState(**state_dict)
            else:
                updated_state = prev_state or ConversationState()

            return ChatResponse(
                message=data.get("message", raw_text),
                facts=data.get("facts", []),
                analysis=data.get("analysis", []),
                suggestions=data.get("suggestions", []),
                visual_blocks=visual_blocks,
                suggested_follow_ups=data.get("suggested_follow_ups", [
                    "What if I cut restaurants by 20%?",
                    "Where can I save $500 a month?",
                    "Am I on track to save $25,000?"
                ]),
                tool_calls_executed=tool_names,
                tool_traces=tool_traces,
                conversation_state=updated_state
            )
        except Exception:
            return ChatResponse(
                message=raw_text,
                facts=[],
                analysis=[],
                suggestions=[],
                visual_blocks=[],
                suggested_follow_ups=[
                    "Why did I spend more this month?",
                    "What were my biggest restaurant expenses?",
                    "Am I on track to save $25,000?"
                ],
                tool_calls_executed=tool_names,
                tool_traces=tool_traces,
                conversation_state=prev_state or ConversationState()
            )
