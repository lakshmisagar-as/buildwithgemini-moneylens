import unittest
import sys
import os

# Add project root to sys.path
sys.path.insert(0, "/config/Desktop/BuildWithGemini")

from moneylens.backend.data.finance_engine import FinanceEngine

class TestFinanceEngine(unittest.TestCase):
    def setUp(self):
        self.engine = FinanceEngine(":memory:")

    def test_overview(self):
        ov = self.engine.get_overview("2026-09")
        self.assertEqual(ov["monthly_income"], 8500.0)
        self.assertGreater(ov["monthly_spending"], 0)
        self.assertGreater(ov["monthly_savings"], 0)
        self.assertIn("category_breakdown", ov)
        self.assertIn("savings_goal", ov)

    def test_get_transactions_filter(self):
        txs = self.engine.get_transactions(category="Restaurants", limit=5)
        self.assertGreater(len(txs), 0)
        for t in txs:
            self.assertEqual(t["category"], "Restaurants")

    def test_compare_periods(self):
        comp = self.engine.compare_periods("2026-08", "2026-09")
        self.assertIn("difference", comp)
        self.assertIn("breakdown_comparison", comp)
        # August had restaurant spike
        items = {c["item"]: c for c in comp["breakdown_comparison"]}
        self.assertIn("Restaurants", items)

    def test_scenario(self):
        res = self.engine.run_scenario(category="Restaurants", current_spending=600.0, percentage_change=-30.0)
        self.assertEqual(res["monthly_savings"], 180.0)
        self.assertEqual(res["annual_savings"], 2160.0)

    def test_savings_projection(self):
        proj = self.engine.calculate_savings_projection(target_amount=25000.0, target_date="2026-12-31")
        self.assertIn("on_track", proj)
        self.assertIn("required_monthly_savings", proj)

if __name__ == "__main__":
    unittest.main()
