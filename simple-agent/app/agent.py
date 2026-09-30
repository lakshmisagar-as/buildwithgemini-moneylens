# Copyright 2026 Google LLC
# Licensed under the Apache License, Version 2.0
"""The Lens — ADK Personal Finance Agent on Vertex AI Agent Runtime."""

import json
from typing import Optional, List, Dict, Any

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

from app.data.finance_engine import FinanceEngine

MODEL = "gemini-2.5-flash"
engine = FinanceEngine()

# --- ADK Tool Definitions ---

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
    """Query individual transactions sorted by amount descending with optional filters (category, merchant, min/max amount, dates).

    Args:
        start_date: Optional start date (YYYY-MM-DD).
        end_date: Optional end date (YYYY-MM-DD).
        category: Optional category filter (e.g. 'Restaurants', 'Travel', 'Groceries').
        merchant: Optional merchant name substring.
        min_amount: Optional minimum transaction dollar amount.
        max_amount: Optional maximum transaction dollar amount.
        limit: Max number of transactions to return (default 10).
        tx_type: 'expense' or 'income'.

    Returns:
        A JSON string containing list of matching transactions.
    """
    res = engine.get_transactions(
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
    """Get total spending aggregated by category, merchant, or month for a given date range.

    Args:
        start_date: Optional start date in YYYY-MM-DD format (e.g. '2026-08-01').
        end_date: Optional end date in YYYY-MM-DD format (e.g. '2026-08-31').
        group_by: 'category', 'merchant', or 'date'.

    Returns:
        A JSON string containing grouped spending totals and percentages.
    """
    res = engine.get_spending_summary(start_date=start_date, end_date=end_date, group_by=group_by)
    return json.dumps(res)


def compare_periods(
    period1: str = "2026-08",
    period2: str = "2026-09",
    group_by: str = "category"
) -> str:
    """Compare total and grouped spending between two periods. Period1 is baseline (e.g. '2026-08') and Period2 is comparison (e.g. '2026-09').

    Args:
        period1: Baseline period (YYYY-MM).
        period2: Comparison period (YYYY-MM).
        group_by: Grouping key ('category' or 'merchant').

    Returns:
        A JSON string with total change, percentage change, and category deltas.
    """
    res = engine.compare_periods(period1=period1, period2=period2, group_by=group_by)
    return json.dumps(res)


def get_budget(month: str = "2026-09") -> str:
    """Retrieve the user's monthly budget allocations, actual spending, and utilization percentages.

    Args:
        month: Month string in YYYY-MM format.

    Returns:
        A JSON string with budget categories, limits, actual spent, and remaining amounts.
    """
    res = engine.get_budget(month=month)
    return json.dumps(res)


def calculate_savings_projection(
    target_amount: float = 25000.0,
    target_date: str = "2026-12-31"
) -> str:
    """Analyze savings trajectories, required monthly savings, and determine whether the user is on track to reach a target savings goal (e.g. $25,000 by 2026-12-31).

    Args:
        target_amount: Target goal amount (default 25000.0).
        target_date: Target completion date (default '2026-12-31').

    Returns:
        A JSON string with current balance, target, on-track status, and projected completion date.
    """
    res = engine.calculate_savings_projection(target_amount=target_amount, target_date=target_date)
    return json.dumps(res)


def run_financial_scenario(
    category: Optional[str] = None,
    change_type: str = "percentage",
    change_value: float = -20.0,
    frequency: str = "monthly",
    duration_months: int = 12
) -> str:
    """Model the projected monthly, annual, and savings goal impact of any financial change.

    Args:
        category: Category to adjust (e.g. 'Restaurants', 'Groceries', 'General Savings', 'Salary').
        change_type: 'percentage', 'fixed_amount', or 'set_amount'.
        change_value: Numeric change (e.g. -20 for -20%, 500 for +$500).
        frequency: 'monthly' or 'one_time'.
        duration_months: Projection horizon in months (default 12).

    Returns:
        A JSON string with simulated monthly savings, net delta, and goal completion shift.
    """
    changes = [{
        "category": category,
        "change_type": change_type,
        "change_value": change_value,
        "frequency": frequency
    }]
    res = engine.run_financial_scenario(changes=changes, duration_months=duration_months)
    return json.dumps(res)


def detect_hidden_money() -> str:
    """Scan transactions to find hidden money: unused subscriptions, restaurant surges, travel spikes, and goal surplus.

    Returns:
        A JSON string list of high-impact opportunities with evidence and action steps.
    """
    res = engine.detect_hidden_money()
    return json.dumps(res)


def get_user_preferences() -> str:
    """Retrieve the user's structured preferences, financial rules, priorities, and constraints.

    Returns:
        A JSON string list of active user preferences.
    """
    res = engine.get_user_preferences()
    return json.dumps(res)


# --- Root Agent & App Definition ---

SYSTEM_INSTRUCTION = """You are "The Lens", an expert, transparent, and empathetic AI financial copilot powered by Gemini and Google ADK.
Your primary role is to help users understand their personal finances, analyze trends, simulate scenarios, and make informed decisions.

Dataset Context:
- The dataset covers January 2026 through September 2026.
- The active/current month is September 2026.
- The user's primary savings goal is $25,000 for emergency reserve and house downpayment.

CRITICAL RULES:
1. DETERMINISTIC MATH: NEVER guess or hallucinate financial numbers. ALWAYS invoke the appropriate tool to calculate numbers.
2. CONTEXT & PRONOUN RESOLUTION: If the user refers to "that", "it", or previous topics, resolve it using recent conversation context.
3. PREFERENCES & CONSTRAINTS: Respect active user preferences (e.g., protected travel budget, emergency fund floor).
4. CONCISE & ACTIONABLE: Deliver direct answers with exact verified dollar amounts, followed by crisp insights.
"""

root_agent = Agent(
    name="the_lens",
    model=Gemini(
        model=MODEL,
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction=SYSTEM_INSTRUCTION,
    tools=[
        get_transactions,
        get_spending_summary,
        compare_periods,
        get_budget,
        calculate_savings_projection,
        run_financial_scenario,
        detect_hidden_money,
        get_user_preferences,
    ],
)

app = App(
    root_agent=root_agent,
    name="the_lens",
)
