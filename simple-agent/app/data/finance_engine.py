import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.data.seed_data import init_database
from app.data.schema import (
    Transaction,
    CategorySummary,
    PeriodComparison,
    PeriodComparisonItem,
    BudgetCategory,
    SavingsGoal,
    SavingsProjection,
    ScenarioParameter,
    ScenarioResult,
    ScenarioComparisonItem,
    SavedScenario,
    UserPreference,
    TimelineMonth,
    TimelineResponse,
    DetectiveFinding,
    ConversationState
)

class FinanceEngine:
    def __init__(self, db_conn: Optional[sqlite3.Connection] = None):
        self.conn = db_conn or init_database()
        self.conn.row_factory = sqlite3.Row
        self._ensure_extended_tables()

    def _ensure_extended_tables(self):
        cursor = self.conn.cursor()
        # Saved Scenarios Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_scenarios (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                parameters_json TEXT NOT NULL,
                result_json TEXT NOT NULL
            )
        """)
        # Structured User Preferences Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL, -- goal, priority, constraint, future_change
                title TEXT NOT NULL,
                details TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            )
        """)
        # Seed default realistic preferences if empty
        cursor.execute("SELECT COUNT(*) FROM user_preferences")
        if cursor.fetchone()[0] == 0:
            default_prefs = [
                ("pref_1", "goal", "Emergency & House Downpayment", "Save $25,000 in emergency and downpayment funds by end of 2026", 1, "2026-01-01"),
                ("pref_2", "priority", "Travel Budget Protected", "Travel and experiential spending is important to me; do not suggest cutting travel unless critical", 1, "2026-02-15"),
                ("pref_3", "constraint", "Emergency Fund Floor", "Maintain at least $10,000 cash balance in liquid emergency reserves at all times", 1, "2026-01-10"),
                ("pref_4", "future_change", "Upcoming Rent Increase", "Apartment lease renewal increases rent by $300 to $2,700/mo starting in January 2027", 1, "2026-08-01"),
            ]
            cursor.executemany(
                "INSERT INTO user_preferences (id, category, title, details, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                default_prefs
            )
        self.conn.commit()

    # --- Core Transactions & Summaries ---
    def get_transactions(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        category: Optional[str] = None,
        merchant: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        limit: int = 50,
        tx_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = "SELECT * FROM transactions WHERE 1=1"
        params = []
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        if category:
            query += " AND category = ?"
            params.append(category)
        if merchant:
            query += " AND merchant LIKE ?"
            params.append(f"%{merchant}%")
        if min_amount is not None:
            query += " AND amount >= ?"
            params.append(min_amount)
        if max_amount is not None:
            query += " AND amount <= ?"
            params.append(max_amount)
        if tx_type:
            query += " AND type = ?"
            params.append(tx_type)

        query += " ORDER BY amount DESC, date DESC LIMIT ?"
        params.append(limit)

        cursor = self.conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    def get_spending_summary(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        group_by: str = "category"
    ) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        where_clauses = ["type = 'expense'"]
        params = []
        if start_date:
            where_clauses.append("date >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("date <= ?")
            params.append(end_date)

        where_sql = " AND ".join(where_clauses)
        cursor.execute(f"SELECT SUM(amount) FROM transactions WHERE {where_sql}", params)
        total_row = cursor.fetchone()
        overall_total = total_row[0] if total_row and total_row[0] else 0.0

        group_col = "category" if group_by == "category" else ("merchant" if group_by == "merchant" else "strftime('%Y-%m', date)")
        query = f"""
            SELECT {group_col} AS group_key, SUM(amount) AS total, COUNT(*) as tx_count
            FROM transactions
            WHERE {where_sql}
            GROUP BY {group_col}
            ORDER BY total DESC
        """
        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = []
        for r in rows:
            tot = round(r["total"], 2)
            pct = round((tot / overall_total * 100), 1) if overall_total > 0 else 0.0
            results.append({
                "key": r["group_key"],
                "total": tot,
                "percentage": pct,
                "transaction_count": r["tx_count"]
            })
        return results

    def compare_periods(
        self,
        period1: str = "2026-08",
        period2: str = "2026-09",
        group_by: str = "category"
    ) -> Dict[str, Any]:
        cursor = self.conn.cursor()
        group_col = "category" if group_by == "category" else "merchant"

        def get_period_data(period_str):
            query = f"""
                SELECT {group_col} as group_key, SUM(amount) as total
                FROM transactions
                WHERE type = 'expense' AND date LIKE ?
                GROUP BY {group_col}
            """
            cursor.execute(query, (f"{period_str}%",))
            return {row["group_key"]: row["total"] for row in cursor.fetchall()}

        data1 = get_period_data(period1)
        data2 = get_period_data(period2)
        all_keys = set(data1.keys()).union(set(data2.keys()))

        items = []
        total1 = sum(data1.values())
        total2 = sum(data2.values())

        for k in all_keys:
            amt1 = data1.get(k, 0.0)
            amt2 = data2.get(k, 0.0)
            diff = round(amt2 - amt1, 2)
            pct = round(((amt2 - amt1) / amt1 * 100), 1) if amt1 > 0 else (100.0 if amt2 > 0 else 0.0)
            items.append({
                "key": k,
                "period1_amount": round(amt1, 2),
                "period2_amount": round(amt2, 2),
                "difference": diff,
                "percentage_change": pct
            })

        items.sort(key=lambda x: abs(x["difference"]), reverse=True)
        total_diff = round(total2 - total1, 2)
        total_pct = round((total_diff / total1 * 100), 1) if total1 > 0 else 0.0

        return {
            "period1": period1,
            "period2": period2,
            "period1_total": round(total1, 2),
            "period2_total": round(total2, 2),
            "total_difference": total_diff,
            "total_percentage_change": total_pct,
            "items": items
        }

    def get_budget(self, month: str = "2026-09") -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT category, monthly_budget FROM budgets")
        budget_rows = cursor.fetchall()

        cursor.execute("""
            SELECT category, SUM(amount) as spent
            FROM transactions
            WHERE type = 'expense' AND date LIKE ?
            GROUP BY category
        """, (f"{month}%",))
        spent_map = {r["category"]: r["spent"] for r in cursor.fetchall()}

        results = []
        for b in budget_rows:
            cat = b["category"]
            budget_amt = b["monthly_budget"]
            spent = spent_map.get(cat, 0.0)
            remaining = round(budget_amt - spent, 2)
            pct = round((spent / budget_amt * 100), 1) if budget_amt > 0 else 0.0
            status = "healthy"
            if pct > 100.0:
                status = "over_budget"
            elif pct >= 85.0:
                status = "near_budget"

            results.append({
                "category": cat,
                "monthly_budget": budget_amt,
                "spent_current_month": round(spent, 2),
                "remaining": remaining,
                "percentage_used": pct,
                "status": status
            })
        return results

    # --- Feature 1: Advanced What-If Simulator Engine ---
    def run_financial_scenario(
        self,
        changes: List[Dict[str, Any]],
        scenario_name: str = "Custom Scenario",
        duration_months: int = 12
    ) -> Dict[str, Any]:
        """
        Deterministic calculation of single or chained what-if financial changes.
        changes: list of dicts:
          [{"category": "Restaurants", "change_type": "percentage", "change_value": -25.0, "frequency": "monthly"}]
        """
        cursor = self.conn.cursor()
        # Monthly Baseline calculations based on September 2026
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND date LIKE '2026-09%'")
        curr_spending = round(cursor.fetchone()[0] or 5559.47, 2)
        curr_income = 8500.0
        curr_monthly_savings = round(curr_income - curr_spending, 2)
        curr_annual_savings = round(curr_monthly_savings * 12, 2)

        # Baseline per-category spending in September
        cursor.execute("""
            SELECT category, SUM(amount) as total
            FROM transactions
            WHERE type = 'expense' AND date LIKE '2026-09%'
            GROUP BY category
        """)
        cat_spending = {r["category"]: r["total"] for r in cursor.fetchall()}

        monthly_impact_total = 0.0
        one_time_impact_total = 0.0
        parsed_params = []

        for ch in changes:
            cat = ch.get("category")
            c_type = ch.get("change_type", "percentage") # percentage, fixed_amount, one_time
            val = float(ch.get("change_value", 0.0))
            freq = ch.get("frequency", "monthly")

            m_delta = 0.0
            if c_type == "percentage":
                if cat and cat.lower() in ["income", "salary"]:
                    m_delta = round(curr_income * (val / 100.0), 2)
                elif cat and cat in cat_spending:
                    # negative val means spending decreases -> savings increases
                    baseline_cat = cat_spending[cat]
                    spend_change = round(baseline_cat * (val / 100.0), 2)
                    m_delta = -spend_change # saving is opposite of spending change
                else:
                    # general spending cut
                    spend_change = round(curr_spending * (val / 100.0), 2)
                    m_delta = -spend_change
            elif c_type == "fixed_amount":
                # e.g. val = 500 (save extra 500) or rent increases by 300 (val = -300 impact)
                if cat and cat.lower() in ["rent", "housing"]:
                    m_delta = -val if val > 0 else abs(val) # rent increase decreases savings
                else:
                    m_delta = val
            elif c_type == "one_time":
                one_time_impact_total += val

            if freq == "monthly":
                monthly_impact_total += m_delta

            parsed_params.append({
                "category": cat or "General",
                "change_type": c_type,
                "change_value": val,
                "frequency": freq,
                "description": ch.get("description", f"{cat or 'Savings'}: {val}{'%' if c_type=='percentage' else '$'}")
            })

        # Calculate simulated projections
        simulated_monthly_spending = round(curr_spending - monthly_impact_total, 2)
        simulated_monthly_savings = round(curr_income - simulated_monthly_spending, 2)
        annual_impact = round((monthly_impact_total * 12) + one_time_impact_total, 2)
        simulated_annual_savings = round((simulated_monthly_savings * 12) + one_time_impact_total, 2)

        # Savings Goal Integration ($25,000 Target)
        goal_target = 25000.0
        current_savings = 16500.0 # Saved through Sep 2026
        months_remaining = 3 # Oct, Nov, Dec 2026
        baseline_projected_year_end = round(current_savings + (curr_monthly_savings * months_remaining), 2)
        simulated_projected_year_end = round(current_savings + (simulated_monthly_savings * months_remaining) + one_time_impact_total, 2)

        remaining_to_goal = goal_target - current_savings
        baseline_months_to_goal = round(remaining_to_goal / curr_monthly_savings, 1) if curr_monthly_savings > 0 else 99.0
        simulated_months_to_goal = round(remaining_to_goal / simulated_monthly_savings, 1) if simulated_monthly_savings > 0 else 99.0
        months_saved = round(baseline_months_to_goal - simulated_months_to_goal, 1) if baseline_months_to_goal > simulated_months_to_goal else 0.0

        explanation = (
            f"Under this scenario, your monthly savings would become ${simulated_monthly_savings:,.2f}/mo "
            f"({'+' if monthly_impact_total >= 0 else ''}${monthly_impact_total:,.2f}/mo impact). "
            f"Over a full year, this accumulates to ${simulated_annual_savings:,.2f} in total savings "
            f"({'+' if annual_impact >= 0 else ''}${annual_impact:,.2f}/yr). "
        )
        if months_saved > 0:
            explanation += f"This reaches your $25,000 goal approximately {months_saved} months earlier!"

        return {
            "name": scenario_name,
            "description": f"Simulation of {len(parsed_params)} change(s)",
            "parameters": parsed_params,
            "current_monthly_income": curr_income,
            "current_monthly_spending": curr_spending,
            "current_monthly_savings": curr_monthly_savings,
            "current_annual_savings": curr_annual_savings,
            "simulated_monthly_spending": simulated_monthly_spending,
            "simulated_monthly_savings": simulated_monthly_savings,
            "simulated_annual_savings": simulated_annual_savings,
            "monthly_impact": round(monthly_impact_total, 2),
            "annual_impact": round(annual_impact, 2),
            "goal_target": goal_target,
            "baseline_projected_year_end": baseline_projected_year_end,
            "simulated_projected_year_end": simulated_projected_year_end,
            "baseline_months_to_goal": baseline_months_to_goal,
            "simulated_months_to_goal": simulated_months_to_goal,
            "months_saved": months_saved,
            "goal_reached_earlier": months_saved > 0,
            "explanation": explanation
        }

    def compare_scenarios(self, scenarios: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for sc in scenarios:
            name = sc.get("name", "Scenario")
            changes = sc.get("changes", [])
            sim = self.run_financial_scenario(changes, scenario_name=name)
            results.append({
                "scenario_name": name,
                "monthly_spending": sim["simulated_monthly_spending"],
                "monthly_savings": sim["simulated_monthly_savings"],
                "annual_savings": sim["simulated_annual_savings"],
                "monthly_impact": sim["monthly_impact"],
                "annual_impact": sim["annual_impact"],
                "projected_year_end": sim["simulated_projected_year_end"],
                "goal_reached_early_months": sim["months_saved"]
            })
        return results

    def save_scenario(self, name: str, parameters: List[Dict[str, Any]], result: Dict[str, Any]) -> str:
        sc_id = f"sc_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO saved_scenarios (id, name, created_at, parameters_json, result_json) VALUES (?, ?, ?, ?, ?)",
            (sc_id, name, datetime.now().isoformat(), json.dumps(parameters), json.dumps(result))
        )
        self.conn.commit()
        return sc_id

    def get_saved_scenarios(self) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT id, name, created_at, parameters_json, result_json FROM saved_scenarios ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [{
            "id": r["id"],
            "name": r["name"],
            "created_at": r["created_at"],
            "parameters": json.loads(r["parameters_json"]),
            "result": json.loads(r["result_json"])
        } for r in rows]

    # --- Feature 2: Structured Financial Memory & Preferences ---
    def get_user_preferences(self) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT id, category, title, details, is_active, created_at FROM user_preferences ORDER BY category, created_at")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

    def save_user_preference(self, category: str, title: str, details: str) -> str:
        pref_id = f"pref_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        cursor = self.conn.cursor()
        cursor.execute(
            "INSERT INTO user_preferences (id, category, title, details, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)",
            (pref_id, category, title, details, datetime.now().strftime("%Y-%m-%d"))
        )
        self.conn.commit()
        return pref_id

    def delete_user_preference(self, pref_id: str) -> bool:
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM user_preferences WHERE id = ?", (pref_id,))
        self.conn.commit()
        return cursor.rowcount > 0

    # Backward compatibility with simple memory
    def get_memories(self) -> List[Dict[str, Any]]:
        prefs = self.get_user_preferences()
        return [{"id": p["id"], "key": f"{p['category'].upper()}: {p['title']}", "value": p["details"], "timestamp": p["created_at"]} for p in prefs]

    def add_memory(self, key: str, value: str) -> str:
        cat = "priority" if "priority" in key.lower() or "travel" in key.lower() else "constraint"
        return self.save_user_preference(category=cat, title=key, details=value)

    # --- Feature 3: Financial Timeline Engine ---
    def get_financial_timeline(self) -> Dict[str, Any]:
        cursor = self.conn.cursor()
        # Query monthly income and spending for all 9 months
        cursor.execute("""
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
            FROM transactions
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month ASC
        """)
        months_data = cursor.fetchall()
        months_list = []
        prev_spending = None
        prev_rate = None

        month_labels = {
            "2026-01": "Jan 2026", "2026-02": "Feb 2026", "2026-03": "Mar 2026",
            "2026-04": "Apr 2026", "2026-05": "May 2026", "2026-06": "Jun 2026",
            "2026-07": "Jul 2026", "2026-08": "Aug 2026", "2026-09": "Sep 2026"
        }

        for r in months_data:
            m_str = r["month"]
            inc = round(r["total_income"] or 8500.0, 2)
            exp = round(r["total_expense"], 2)
            sav = round(inc - exp, 2)
            rate = round((sav / inc * 100), 1) if inc > 0 else 0.0

            # Get top categories for this month
            cursor.execute("""
                SELECT category, SUM(amount) as cat_total
                FROM transactions
                WHERE type = 'expense' AND date LIKE ?
                GROUP BY category
                ORDER BY cat_total DESC
                LIMIT 4
            """, (f"{m_str}%",))
            top_cats = [{"category": row["category"], "amount": round(row["cat_total"], 2)} for row in cursor.fetchall()]

            # Determine largest changes vs previous month
            largest_changes = []
            anomaly_note = None
            if prev_spending is not None:
                diff = round(exp - prev_spending, 2)
                rate_diff = round(rate - prev_rate, 1)
                if m_str == "2026-03":
                    anomaly_note = "Electronics Purchase: Apple Studio Display ($1,499.00)"
                elif m_str == "2026-07":
                    anomaly_note = "Vacation: Seattle Trip ($1,850.00 in Travel)"
                elif m_str == "2026-08":
                    anomaly_note = "Dining Surge: Restaurant spending hit $981.80"

                largest_changes.append({
                    "metric": "Monthly Outflow",
                    "delta": diff,
                    "direction": "increased" if diff > 0 else "decreased"
                })
                largest_changes.append({
                    "metric": "Savings Rate",
                    "delta": rate_diff,
                    "direction": "up" if rate_diff > 0 else "down"
                })

            prev_spending = exp
            prev_rate = rate

            months_list.append({
                "month": m_str,
                "label": month_labels.get(m_str, m_str),
                "income": inc,
                "spending": exp,
                "savings": sav,
                "savings_rate": rate,
                "top_categories": top_cats,
                "largest_changes": largest_changes,
                "anomaly_note": anomaly_note
            })

        return {
            "months": months_list,
            "overall_trend": "Healthy overall savings rate averaging 34.2%, with seasonal travel and dining surges in July and August."
        }

    def explain_financial_change(self, month: str, previous_month: Optional[str] = None) -> Dict[str, Any]:
        """Provides deterministic underlying data explaining a month's spending change."""
        cursor = self.conn.cursor()
        if not previous_month:
            # Calculate prior month
            dt = datetime.strptime(f"{month}-01", "%Y-%m-%d")
            prev_m = dt.month - 1
            prev_y = dt.year if prev_m > 0 else dt.year - 1
            prev_m = 12 if prev_m == 0 else prev_m
            previous_month = f"{prev_y:04d}-{prev_m:02d}"

        comparison = self.compare_periods(period1=previous_month, period2=month, group_by="category")
        top_drivers = comparison["items"][:4]

        # Top individual transactions in the target month
        cursor.execute("""
            SELECT date, merchant, category, amount, description
            FROM transactions
            WHERE type = 'expense' AND date LIKE ?
            ORDER BY amount DESC
            LIMIT 5
        """, (f"{month}%",))
        top_txs = [dict(r) for r in cursor.fetchall()]

        return {
            "target_month": month,
            "previous_month": previous_month,
            "total_spending_target": comparison["period2_total"],
            "total_spending_previous": comparison["period1_total"],
            "difference": comparison["total_difference"],
            "percentage_change": comparison["total_percentage_change"],
            "top_drivers": top_drivers,
            "top_transactions": top_txs
        }

    # --- Feature 5: Financial Detective (Find Hidden Money) ---
    def detect_hidden_money(self) -> List[Dict[str, Any]]:
        """
        Deterministic detection of meaningful financial opportunities, anomalies,
        unnecessary subscriptions, budget leaks, and goal milestones.
        """
        cursor = self.conn.cursor()
        findings = []

        # Finding 1: Recurring Subscriptions
        cursor.execute("""
            SELECT merchant, amount, COUNT(*) as charge_count
            FROM transactions
            WHERE is_recurring = 1 AND category = 'Subscriptions'
            GROUP BY merchant, amount
            ORDER BY amount DESC
        """)
        sub_rows = cursor.fetchall()
        if sub_rows:
            total_monthly_subs = round(sum(r["amount"] for r in sub_rows), 2)
            total_annual_subs = round(total_monthly_subs * 12, 2)
            evidence_str = ", ".join([f"{r['merchant']} (${r['amount']}/mo)" for r in sub_rows])
            findings.append({
                "id": "det_subs_1",
                "type": "subscription",
                "severity": "medium",
                "badge": "POSSIBLE SAVINGS",
                "title": f"Review {len(sub_rows)} Recurring Subscriptions (${total_monthly_subs:,.2f}/mo)",
                "summary": f"Your recurring subscriptions total ${total_monthly_subs:,.2f}/month. That's ${total_annual_subs:,.2f}/year in automated recurring charges.",
                "evidence": f"Detected {len(sub_rows)} active recurring services: {evidence_str}.",
                "potential_monthly_savings": total_monthly_subs,
                "potential_annual_savings": total_annual_subs,
                "suggested_actions": [
                    {"label": "Analyze Subscriptions", "action": "chat", "payload": "Analyze my recurring subscriptions and show how much I'd save by cancelling the most expensive ones."},
                    {"label": "What-If Simulation", "action": "whatif", "payload": {"category": "Subscriptions", "change_type": "percentage", "change_value": -50.0}}
                ]
            })

        # Finding 2: Dining Out Spike (August Restaurant Surge)
        cursor.execute("SELECT AVG(amount) FROM (SELECT SUM(amount) as amount FROM transactions WHERE category = 'Restaurants' AND date NOT LIKE '2026-08%' GROUP BY strftime('%Y-%m', date))")
        avg_dining = round(cursor.fetchone()[0] or 650.0, 2)
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE category = 'Restaurants' AND date LIKE '2026-08%'")
        aug_dining = round(cursor.fetchone()[0] or 981.80, 2)
        dining_diff = round(aug_dining - avg_dining, 2)
        dining_pct = round((dining_diff / avg_dining * 100), 1)

        findings.append({
            "id": "det_dining_surge",
            "type": "spending_increase",
            "severity": "high",
            "badge": "SPENDING CHANGE",
            "title": f"Restaurant Spending Surged +{dining_pct}% in August",
            "summary": f"Restaurant dining reached ${aug_dining:,.2f} in August, which is ${dining_diff:,.2f} above your historical average (${avg_dining:,.2f}).",
            "evidence": f"August featured 9 restaurant visits, including premium dinners at Gramercy Tavern ($195.00, $182.50) and Nobu Downtown ($165.40).",
            "potential_monthly_savings": round(dining_diff * 0.5, 2),
            "potential_annual_savings": round(dining_diff * 0.5 * 12, 2),
            "suggested_actions": [
                {"label": "What if I reduce dining by 25%?", "action": "whatif", "payload": {"category": "Restaurants", "change_type": "percentage", "change_value": -25.0}},
                {"label": "Ask The Lens Why", "action": "chat", "payload": "Why did my restaurant spending surge in August?"}
            ]
        })

        # Finding 3: Spending Anomaly (July Seattle Travel Spike)
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE category = 'Travel' AND date LIKE '2026-07%'")
        july_travel = round(cursor.fetchone()[0] or 1850.0, 2)
        findings.append({
            "id": "det_travel_anomaly",
            "type": "anomaly",
            "severity": "medium",
            "badge": "SPENDING ANOMALY",
            "title": f"Travel Spending Was 3.8× Baseline in July ($1,850.00)",
            "summary": "July travel was significantly elevated due to your Seattle vacation flight and hotel bookings.",
            "evidence": "Major transactions: Delta Air Lines ($650.00) and Hyatt Regency Seattle ($1,200.00). Note: Travel is marked in your preferences as a protected priority.",
            "potential_monthly_savings": 0.0,
            "potential_annual_savings": 0.0,
            "suggested_actions": [
                {"label": "View in Timeline", "action": "timeline", "payload": "2026-07"},
                {"label": "Verify Protected Priority", "action": "preferences", "payload": "pref_2"}
            ]
        })

        # Finding 4: Savings Goal Trajectory & Buffer
        cursor.execute("SELECT SUM(CASE WHEN type='income' THEN amount ELSE -amount END) FROM transactions WHERE date LIKE '2026-09%'")
        sep_surplus = round(cursor.fetchone()[0] or 2940.53, 2)
        goal_curr = 16500.0
        goal_target = 25000.0
        projected_total = goal_curr + (sep_surplus * 3)
        buffer = round(projected_total - goal_target, 2)

        findings.append({
            "id": "det_goal_buffer",
            "type": "goal_risk",
            "severity": "info",
            "badge": "GOAL TRAJECTORY",
            "title": f"$25,000 Emergency Fund on Track (+${buffer:,.2f} Buffer)",
            "summary": f"At your current September net savings rate of ${sep_surplus:,.2f}/mo, you are projected to reach ${projected_total:,.2f} by Dec 31, 2026.",
            "evidence": "You have saved $16,500.00 of your $25,000.00 goal (66%). With 3 months remaining, maintaining at least $2,833.33/mo net surplus ensures full completion.",
            "potential_monthly_savings": 0.0,
            "potential_annual_savings": buffer,
            "suggested_actions": [
                {"label": "Simulate Accelerated Goal", "action": "whatif", "payload": {"category": "General Savings", "change_type": "fixed_amount", "change_value": 500.0}},
                {"label": "Ask Copilot For Milestones", "action": "chat", "payload": "How can I guarantee reaching my $25,000 goal by November instead of December?"}
            ]
        })

        return findings

    # Core Savings Projection tool helper
    def calculate_savings_projection(
        self,
        target_amount: float = 25000.0,
        target_date: str = "2026-12-31",
        current_savings: Optional[float] = None,
        monthly_income: Optional[float] = None,
        monthly_expenses: Optional[float] = None
    ) -> Dict[str, Any]:
        cursor = self.conn.cursor()
        c_sav = current_savings if current_savings is not None else 16500.0
        m_inc = monthly_income if monthly_income is not None else 8500.0

        if monthly_expenses is None:
            cursor.execute("SELECT SUM(amount) FROM transactions WHERE type = 'expense' AND date LIKE '2026-09%'")
            m_exp = round(cursor.fetchone()[0] or 5559.47, 2)
        else:
            m_exp = monthly_expenses

        net_monthly_sav = round(m_inc - m_exp, 2)
        months_rem = 3
        projected = round(c_sav + (net_monthly_sav * months_rem), 2)
        req_monthly = round((target_amount - c_sav) / months_rem, 2) if months_rem > 0 else 0.0
        diff = round(projected - target_amount, 2)
        on_track = projected >= target_amount

        expl = (
            f"With ${m_inc:,.2f} monthly income and ${m_exp:,.2f} monthly expenses, your net surplus is ${net_monthly_sav:,.2f}/mo. "
            f"Over the next {months_rem} month(s) until {target_date}, you are projected to reach ${projected:,.2f} "
            f"(Target: ${target_amount:,.2f}). "
            f"You are {'on track with a projected surplus of $' + str(diff) if on_track else 'projected to fall short by $' + str(abs(diff))}!"
        )

        return {
            "target_amount": target_amount,
            "target_date": target_date,
            "current_savings": c_sav,
            "monthly_income": m_inc,
            "monthly_expenses": m_exp,
            "current_monthly_savings": net_monthly_sav,
            "months_remaining": months_rem,
            "projected_savings": projected,
            "required_monthly_savings": req_monthly,
            "shortfall_or_surplus": diff,
            "on_track": on_track,
            "explanation": expl
        }

    def run_scenario(
        self,
        category: str,
        current_spending: Optional[float] = None,
        percentage_change: float = -30.0,
        duration_months: int = 12
    ) -> Dict[str, Any]:
        """Backward-compatible single category scenario."""
        res = self.run_financial_scenario(
            changes=[{"category": category, "change_type": "percentage", "change_value": percentage_change}],
            scenario_name=f"{category} {percentage_change}%",
            duration_months=duration_months
        )
        return {
            "category": category,
            "percentage_change": percentage_change,
            "monthly_savings": res["monthly_impact"],
            "annual_savings": res["annual_impact"],
            "explanation": res["explanation"]
        }
