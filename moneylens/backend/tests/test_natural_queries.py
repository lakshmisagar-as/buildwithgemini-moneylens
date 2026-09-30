import sys
import os
import json

sys.path.insert(0, "/config/Desktop/BuildWithGemini")

from moneylens.backend.agent.agent import MoneyLensAgent
from moneylens.backend.data.finance_engine import FinanceEngine

QUESTIONS = [
    # 1. Why did I spend more this month?
    "Why did I spend more this month?",
    # 2. How much did I spend on restaurants in August?
    "How much did I spend on restaurants in August?",
    # 3. What were my biggest expenses?
    "What were my biggest expenses this year?",
    # 4. Where can I cut $500 per month?
    "Where can I cut $500 per month without affecting housing or groceries?",
    # 5. Am I on track to save $25,000 this year?
    "Am I on track to save $25,000 this year?",
    # 6. What happens if I reduce my restaurant spending by 30%?
    "What happens if I reduce my restaurant spending by 30%?",
    # 7. Which subscriptions am I barely using or paying repeatedly?
    "Which subscriptions am I paying for repeatedly?",
    # 8. Compare my spending this month with last month.
    "Compare my spending this month with last month.",
    # 9. What were my biggest restaurant expenses?
    "What were my biggest restaurant expenses?",
    # 10. What if I reduce restaurants by 30% and shopping by 20%?
    "What if I reduce restaurants by 30% and shopping by 20%?"
]

def run_tests():
    agent = MoneyLensAgent()
    print("=" * 80)
    print("RUNNING 10 NATURAL LANGUAGE FINANCE QUERY TESTS")
    print("=" * 80)

    for i, q in enumerate(QUESTIONS, 1):
        print(f"\n--- [{i}/10] Query: '{q}' ---")
        try:
            res = agent.query(q)
            print(f"Tools Executed: {res.tool_calls_executed}")
            print(f"Tool Traces: {[t.tool for t in res.tool_traces]}")
            print(f"Message: {res.message[:140]}...")
            print(f"Facts count: {len(res.facts)}, Analysis count: {len(res.analysis)}, Suggestions count: {len(res.suggestions)}")
            print(f"Visual Blocks: {[b.type for b in res.visual_blocks]}")
            print(f"Follow-ups: {res.suggested_follow_ups}")
        except Exception as e:
            print(f"FAILED with error: {e}")

if __name__ == "__main__":
    run_tests()
