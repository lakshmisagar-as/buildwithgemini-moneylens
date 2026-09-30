import os
import unittest
from moneylens.backend.data.finance_engine import FinanceEngine
from moneylens.backend.agent.agent import MoneyLensAgent
from moneylens.backend.data.schema import ConversationState

class TestConversationalChainAndPreferences(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = FinanceEngine()
        cls.agent = MoneyLensAgent(finance_engine=cls.engine)

    def test_conversational_chain_and_pronouns(self):
        print("\n--- 1. Turn 1: Specific query ---")
        res1 = self.agent.query("How much did I spend on restaurants in August?")
        print("Turn 1 Tools:", res1.tool_calls_executed)
        print("Turn 1 Message:", res1.message[:100])
        self.assertIn("get_spending_summary", res1.tool_calls_executed)

        print("\n--- 2. Turn 2: Pronoun resolution ('that') ---")
        history = [
            {"role": "user", "content": "How much did I spend on restaurants in August?"},
            {"role": "model", "content": res1.message}
        ]
        # State tracking restaurants
        state = ConversationState(
            active_subject="Restaurants",
            current_period="2026-08",
            comparison_period="2026-07"
        )
        res2 = self.agent.query("How much was that in July?", chat_history=history, conversation_state=state)
        print("Turn 2 Tools:", res2.tool_calls_executed)
        print("Turn 2 Message:", res2.message[:100])
        self.assertIn("get_spending_summary", res2.tool_calls_executed)

        print("\n--- 3. Turn 3: Scenario invocation ('What if I reduce it by 20%?') ---")
        history.append({"role": "user", "content": "How much was that in July?"})
        history.append({"role": "model", "content": res2.message})
        res3 = self.agent.query("What if I reduce it by 20%?", chat_history=history, conversation_state=state)
        print("Turn 3 Tools:", res3.tool_calls_executed)
        print("Turn 3 Message:", res3.message[:100])
        self.assertIn("run_financial_scenario", res3.tool_calls_executed)

    def test_preferences_protection_of_travel(self):
        print("\n--- 4. Preferences: Exclude travel ---")
        res = self.agent.query("Where can I cut $500 per month without affecting essentials?")
        print("Preference Test Message:", res.message)
        # Check that agent recognized travel priority preference
        self.assertTrue(
            "travel" in res.message.lower(),
            "Agent should mention travel exclusion or respect travel priority"
        )

if __name__ == "__main__":
    unittest.main()
