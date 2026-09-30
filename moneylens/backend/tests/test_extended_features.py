import unittest
import json
from moneylens.backend.data.finance_engine import FinanceEngine
from moneylens.backend.agent.agent import MoneyLensAgent
from moneylens.backend.data.schema import ConversationState

class TestExtendedMoneyLensFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = FinanceEngine()
        cls.agent = MoneyLensAgent(finance_engine=cls.engine)

    def test_what_if_scenario_deterministic(self):
        # 1. Test cut restaurant spending by 25%
        res = self.engine.run_financial_scenario(
            changes=[{"category": "Restaurants", "change_type": "percentage", "change_value": -25.0}]
        )
        self.assertGreater(res["monthly_impact"], 0.0)
        self.assertAlmostEqual(res["annual_impact"], res["monthly_impact"] * 12, delta=0.5)
        self.assertIn("simulated_monthly_savings", res)
        self.assertIn("baseline_projected_year_end", res)
        self.assertIn("simulated_projected_year_end", res)

    def test_what_if_chained_scenario(self):
        # 2. Test chained scenario: +10% salary and -20% restaurants
        res = self.engine.run_financial_scenario(
            changes=[
                {"category": "Salary", "change_type": "percentage", "change_value": 10.0},
                {"category": "Restaurants", "change_type": "percentage", "change_value": -20.0}
            ]
        )
        self.assertGreater(res["monthly_impact"], 850.0) # salary alone adds $850
        self.assertTrue(res["goal_reached_earlier"])

    def test_scenario_comparison(self):
        scenarios = [
            {"name": "Scenario A", "changes": [{"category": "Restaurants", "change_type": "percentage", "change_value": -20.0}]},
            {"name": "Scenario B", "changes": [{"category": "Restaurants", "change_type": "percentage", "change_value": -35.0}]}
        ]
        comp = self.engine.compare_scenarios(scenarios)
        self.assertEqual(len(comp), 2)
        self.assertGreater(comp[1]["monthly_savings"], comp[0]["monthly_savings"])

    def test_timeline_engine(self):
        timeline = self.engine.get_financial_timeline()
        self.assertEqual(len(timeline["months"]), 9)
        july = next(m for m in timeline["months"] if m["month"] == "2026-07")
        self.assertIn("Seattle Trip", july.get("anomaly_note", ""))

    def test_financial_detective_findings(self):
        findings = self.engine.detect_hidden_money()
        self.assertGreaterEqual(len(findings), 4)
        types = [f["type"] for f in findings]
        self.assertIn("subscription", types)
        self.assertIn("spending_increase", types)
        self.assertIn("anomaly", types)
        self.assertIn("goal_risk", types)

    def test_preferences_and_memory(self):
        prefs = self.engine.get_user_preferences()
        categories = {p["category"] for p in prefs}
        self.assertIn("goal", categories)
        self.assertIn("priority", categories)
        self.assertIn("constraint", categories)
        self.assertIn("future_change", categories)

if __name__ == "__main__":
    unittest.main()
