from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Transaction(BaseModel):
    id: str
    date: str
    merchant: str
    amount: float
    category: str
    type: str = "expense"
    description: Optional[str] = None
    is_recurring: bool = False

class CategorySummary(BaseModel):
    key: str
    total: float
    percentage: float
    transaction_count: int

class PeriodComparisonItem(BaseModel):
    key: str
    period1_amount: float
    period2_amount: float
    difference: float
    percentage_change: float

class PeriodComparison(BaseModel):
    period1: str
    period2: str
    period1_total: float
    period2_total: float
    total_difference: float
    total_percentage_change: float
    items: List[PeriodComparisonItem]

class BudgetCategory(BaseModel):
    category: str
    monthly_budget: float
    spent_current_month: float
    remaining: float
    percentage_used: float
    status: str

class SavingsGoal(BaseModel):
    name: str = "Annual Emergency & Investment Fund"
    target_amount: float = 25000.0
    current_savings: float = 16500.0
    target_date: str = "2026-12-31"
    monthly_contribution: float = 1800.0
    percentage_completed: float = 66.0
    remaining_amount: float = 8500.0

class SavingsProjection(BaseModel):
    target_amount: float
    target_date: str
    current_savings: float
    monthly_income: float
    monthly_expenses: float
    current_monthly_savings: float
    months_remaining: int
    projected_savings: float
    required_monthly_savings: float
    shortfall_or_surplus: float
    on_track: bool
    explanation: str

# 1. What-If Scenario Schemas
class ScenarioParameter(BaseModel):
    category: Optional[str] = None # e.g. "Restaurants", "Salary", "Rent", "Housing", "General Savings"
    change_type: str = "percentage" # "percentage", "fixed_amount", "one_time"
    change_value: float # e.g. -25.0 (-25%), 500.0 ($500), -5000.0 (-$5000)
    frequency: str = "monthly" # "monthly", "one_time"
    description: Optional[str] = None

class ScenarioResult(BaseModel):
    name: Optional[str] = "Custom Scenario"
    description: str
    parameters: List[ScenarioParameter]
    # Current Baseline
    current_monthly_income: float
    current_monthly_spending: float
    current_monthly_savings: float
    current_annual_savings: float
    # Simulated Projection
    simulated_monthly_spending: float
    simulated_monthly_savings: float
    simulated_annual_savings: float
    # Impact
    monthly_impact: float
    annual_impact: float
    # Goal Integration
    goal_target: float = 25000.0
    baseline_projected_year_end: float
    simulated_projected_year_end: float
    baseline_months_to_goal: Optional[float] = None
    simulated_months_to_goal: Optional[float] = None
    months_saved: Optional[float] = None
    goal_reached_earlier: bool = False
    explanation: str

class ScenarioComparisonItem(BaseModel):
    scenario_name: str
    monthly_spending: float
    monthly_savings: float
    annual_savings: float
    monthly_impact: float
    annual_impact: float
    projected_year_end: float
    goal_reached_early_months: float

class SavedScenario(BaseModel):
    id: str
    name: str
    created_at: str
    parameters: List[ScenarioParameter]
    result: ScenarioResult

# 2. Structured Financial Memory & Preferences
class UserPreference(BaseModel):
    id: str
    category: str # "goal", "priority", "constraint", "future_change"
    title: str
    details: str
    is_active: bool = True
    created_at: str

# 3. Financial Timeline Schemas
class TimelineMonth(BaseModel):
    month: str # e.g. "2026-01"
    label: str # e.g. "Jan 2026"
    income: float
    spending: float
    savings: float
    savings_rate: float
    top_categories: List[Dict[str, Any]]
    largest_changes: List[Dict[str, Any]]
    anomaly_note: Optional[str] = None

class TimelineResponse(BaseModel):
    months: List[TimelineMonth]
    overall_trend: str

# 4. Financial Detective Findings
class DetectiveFinding(BaseModel):
    id: str
    type: str # "subscription", "anomaly", "spending_increase", "budget_leak", "price_change", "goal_risk"
    severity: str # "high", "medium", "info"
    badge: str # e.g. "POSSIBLE SAVINGS", "SPENDING CHANGE", "BUDGET LEAK", "GOAL AT RISK"
    title: str
    summary: str
    evidence: str
    potential_monthly_savings: Optional[float] = None
    potential_annual_savings: Optional[float] = None
    suggested_actions: List[Dict[str, Any]]
    underlying_transactions: Optional[List[Transaction]] = None

# 5. Conversational State for Reference Resolution
class ConversationState(BaseModel):
    active_subject: Optional[str] = None # e.g. "Restaurants", "Travel", "Subscriptions"
    current_period: Optional[str] = "2026-09"
    comparison_period: Optional[str] = "2026-08"
    active_metric: Optional[str] = "spending" # "spending", "savings", "budget"
    active_scenario: Optional[Dict[str, Any]] = None
    active_goal: Optional[str] = "$25,000 Annual Savings Goal"

# Chat Models
class VisualBlock(BaseModel):
    type: str # "metric_card", "chart_bar", "chart_doughnut", "chart_line", "transaction_table", "scenario_card", "savings_projection", "comparison_matrix"
    title: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)

class ToolTrace(BaseModel):
    tool: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    status: str = "success"

class ChatResponse(BaseModel):
    message: str
    facts: List[str] = Field(default_factory=list)
    analysis: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    visual_blocks: List[VisualBlock] = Field(default_factory=list)
    suggested_follow_ups: List[str] = Field(default_factory=list)
    tool_calls_executed: List[str] = Field(default_factory=list)
    tool_traces: List[ToolTrace] = Field(default_factory=list)
    conversation_state: Optional[ConversationState] = None

class ChatRequest(BaseModel):
    prompt: str
    history: Optional[List[Dict[str, str]]] = None
    conversation_state: Optional[ConversationState] = None
