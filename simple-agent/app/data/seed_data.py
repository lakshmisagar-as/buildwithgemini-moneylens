import datetime
import sqlite3
from typing import List, Dict, Any

CATEGORIES = [
    "Housing",
    "Groceries",
    "Restaurants",
    "Transportation",
    "Shopping",
    "Travel",
    "Entertainment",
    "Utilities",
    "Subscriptions",
    "Healthcare",
    "Other"
]

BUDGETS = {
    "Housing": 2400.0,
    "Groceries": 600.0,
    "Restaurants": 650.0,
    "Transportation": 350.0,
    "Shopping": 450.0,
    "Travel": 400.0,
    "Entertainment": 250.0,
    "Utilities": 220.0,
    "Subscriptions": 120.0,
    "Healthcare": 200.0,
    "Other": 150.0
}

SAVINGS_GOAL = {
    "name": "Annual Emergency & Investment Fund",
    "target_amount": 25000.0,
    "current_savings": 16500.0,
    "target_date": "2026-12-31",
    "monthly_contribution": 1800.0
}

INITIAL_USER_MEMORIES = [
    {"id": "mem_1", "key": "Annual Savings Goal", "value": "$25,000 by December 31, 2026", "timestamp": "2026-09-01"},
    {"id": "mem_2", "key": "Housing Preference", "value": "Strict rule: Do not suggest cuts to rent/mortgage or basic groceries", "timestamp": "2026-09-10"},
    {"id": "mem_3", "key": "Planned Vacation", "value": "Seattle trip completed in July ($1,850), Upstate trip in Sept", "timestamp": "2026-09-15"},
    {"id": "mem_4", "key": "Monthly Net Income", "value": "$8,500 deposited on the 1st of every month", "timestamp": "2026-09-01"}
]

def generate_seed_transactions() -> List[Dict[str, Any]]:
    transactions = []
    tx_id_counter = 1000

    def add_tx(dt: datetime.date, amount: float, tx_type: str, category: str, merchant: str, desc: str, is_recurring: bool = False):
        nonlocal tx_id_counter
        tx_id_counter += 1
        transactions.append({
            "id": f"tx_{tx_id_counter}",
            "date": dt.strftime("%Y-%m-%d"),
            "amount": round(amount, 2),
            "type": tx_type,
            "category": category,
            "merchant": merchant,
            "description": desc,
            "is_recurring": is_recurring
        })

    # Months: Jan 2026 to Sep 2026
    for month in range(1, 10):
        # 1. Salary
        add_tx(datetime.date(2026, month, 1), 8500.00, "income", "Income", "TechCorp Inc.", "Monthly Salary", True)
        
        # 2. Housing (Rent)
        add_tx(datetime.date(2026, month, 1), 2400.00, "expense", "Housing", "Avalon Bay Living", "Apartment Rent", True)
        
        # 3. Utilities
        add_tx(datetime.date(2026, month, 15), 165.00 + (month * 4 % 30), "expense", "Utilities", "ConEdison", "Electric & Gas Bill", True)
        add_tx(datetime.date(2026, month, 18), 75.00, "expense", "Utilities", "Verizon Fios", "Gigabit Internet", True)
        
        # 4. Recurring Subscriptions
        add_tx(datetime.date(2026, month, 5), 22.99, "expense", "Subscriptions", "Netflix", "Premium Ultra HD 4K", True)
        add_tx(datetime.date(2026, month, 7), 11.99, "expense", "Subscriptions", "Spotify", "Premium Individual", True)
        add_tx(datetime.date(2026, month, 8), 85.00, "expense", "Subscriptions", "Equinox Fitness", "Monthly Gym Membership", True)
        add_tx(datetime.date(2026, month, 12), 9.99, "expense", "Subscriptions", "Google One", "2TB Cloud Storage", True)
        add_tx(datetime.date(2026, month, 14), 20.00, "expense", "Subscriptions", "OpenAI", "ChatGPT Plus Subscription", True)

        # 5. Groceries
        add_tx(datetime.date(2026, month, 3), 142.50, "expense", "Groceries", "Whole Foods Market", "Weekly groceries")
        add_tx(datetime.date(2026, month, 10), 128.20, "expense", "Groceries", "Trader Joe's", "Organic groceries & snacks")
        add_tx(datetime.date(2026, month, 17), 165.40, "expense", "Groceries", "Whole Foods Market", "Fresh produce & pantry")
        add_tx(datetime.date(2026, month, 24), 115.80, "expense", "Groceries", "Trader Joe's", "Weekly groceries")

        # 6. Transportation
        add_tx(datetime.date(2026, month, 6), 48.50, "expense", "Transportation", "Uber", "Ride to Downtown")
        add_tx(datetime.date(2026, month, 14), 62.00, "expense", "Transportation", "Chevron", "Gas fill-up")
        add_tx(datetime.date(2026, month, 21), 132.00, "expense", "Transportation", "MTA Transit", "Monthly Metro Pass", True)
        add_tx(datetime.date(2026, month, 27), 38.20, "expense", "Transportation", "Lyft", "Ride home from dinner")

        # 7. Healthcare
        if month in [2, 5, 8]:
            add_tx(datetime.date(2026, month, 16), 150.00, "expense", "Healthcare", "One Medical", "Doctor consultation co-pay")
        add_tx(datetime.date(2026, month, 22), 35.50, "expense", "Healthcare", "CVS Pharmacy", "Prescriptions & vitamins")

        # 8. Entertainment
        add_tx(datetime.date(2026, month, 11), 64.00, "expense", "Entertainment", "AMC Theatres", "Movie tickets & concessions")
        add_tx(datetime.date(2026, month, 25), 110.00, "expense", "Entertainment", "Ticketmaster", "Concert / Event ticket")

        # 9. Shopping
        add_tx(datetime.date(2026, month, 9), 84.50, "expense", "Shopping", "Amazon", "Household essentials")
        add_tx(datetime.date(2026, month, 20), 145.00, "expense", "Shopping", "Nordstrom", "Clothing & accessories")

        # Intentional anomaly in March
        if month == 3:
            add_tx(datetime.date(2026, 3, 15), 1499.00, "expense", "Shopping", "Apple Store", "Apple Studio Display 27-inch 5K")

        # 10. Restaurants
        if month == 8: # August: Surge ($980+)
            add_tx(datetime.date(2026, 8, 2), 78.50, "expense", "Restaurants", "Sushi Nakazawa", "Omakase dinner")
            add_tx(datetime.date(2026, 8, 4), 45.20, "expense", "Restaurants", "Sweetgreen", "Lunch bowl with colleagues")
            add_tx(datetime.date(2026, 8, 7), 185.00, "expense", "Restaurants", "Le Bernardin", "Anniversary fine dining")
            add_tx(datetime.date(2026, 8, 12), 120.40, "expense", "Restaurants", "Carbone", "Italian dinner with friends")
            add_tx(datetime.date(2026, 8, 16), 88.00, "expense", "Restaurants", "Quality Italian", "Dinner & wine")
            add_tx(datetime.date(2026, 8, 19), 65.50, "expense", "Restaurants", "Blue Ribbon Brasserie", "Late night dinner")
            add_tx(datetime.date(2026, 8, 23), 210.00, "expense", "Restaurants", "Gramercy Tavern", "Tasting menu dinner")
            add_tx(datetime.date(2026, 8, 26), 94.20, "expense", "Restaurants", "Momofuku Noodle Bar", "Dinner & drinks")
            add_tx(datetime.date(2026, 8, 29), 95.00, "expense", "Restaurants", "Joe's Stone Crab", "Seafood dinner")
        elif month == 7: # July: Travel month
            add_tx(datetime.date(2026, 7, 5), 850.00, "expense", "Travel", "Delta Air Lines", "Round-trip flights to Seattle")
            add_tx(datetime.date(2026, 7, 10), 1000.00, "expense", "Travel", "Four Seasons Seattle", "4 nights hotel stay")
            add_tx(datetime.date(2026, 7, 11), 165.00, "expense", "Restaurants", "The Pink Door", "Dinner in Pike Place")
            add_tx(datetime.date(2026, 7, 12), 125.00, "expense", "Restaurants", "Canlis", "Waterfront dinner")
            add_tx(datetime.date(2026, 7, 18), 75.00, "expense", "Restaurants", "Sweetgreen", "Team lunch")
            add_tx(datetime.date(2026, 7, 26), 95.00, "expense", "Restaurants", "Lucali", "Brick-oven pizza with friends")
        elif month == 9: # September
            add_tx(datetime.date(2026, 9, 3), 95.40, "expense", "Restaurants", "Lilia", "Italian dinner with friends")
            add_tx(datetime.date(2026, 9, 6), 38.50, "expense", "Restaurants", "Chipotle", "Burrito & chips")
            add_tx(datetime.date(2026, 9, 10), 145.00, "expense", "Restaurants", "Peter Luger Steak House", "Steak dinner")
            add_tx(datetime.date(2026, 9, 14), 62.00, "expense", "Restaurants", "Sweetgreen", "Work lunches")
            add_tx(datetime.date(2026, 9, 18), 118.00, "expense", "Restaurants", "Balthazar", "Bistro dinner")
            add_tx(datetime.date(2026, 9, 23), 85.00, "expense", "Restaurants", "Ippudo Ramen", "Dinner & appetizers")
            add_tx(datetime.date(2026, 9, 28), 148.00, "expense", "Restaurants", "Nobu Downtown", "Sushi dinner")
            add_tx(datetime.date(2026, 9, 12), 480.00, "expense", "Travel", "Airbnb", "Weekend upstate cabin")
            add_tx(datetime.date(2026, 9, 22), 320.00, "expense", "Shopping", "Zara", "Autumn coats & boots")
        else:
            add_tx(datetime.date(2026, month, 4), 115.00, "expense", "Restaurants", "Lilia", "Dinner with friends")
            add_tx(datetime.date(2026, month, 12), 85.00, "expense", "Restaurants", "Balthazar", "Brunch")
            add_tx(datetime.date(2026, month, 19), 140.00, "expense", "Restaurants", "Nobu Downtown", "Sushi dinner")
            add_tx(datetime.date(2026, month, 23), 65.00, "expense", "Restaurants", "Sweetgreen", "Salad lunches")
            add_tx(datetime.date(2026, month, 27), 195.00, "expense", "Restaurants", "Gramercy Tavern", "Dinner")

    transactions.sort(key=lambda x: x["date"], reverse=True)
    return transactions

def init_database() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE transactions (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            merchant TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            is_recurring INTEGER DEFAULT 0
        )
    """)
    cursor.execute("""
        CREATE TABLE budgets (
            category TEXT PRIMARY KEY,
            monthly_budget REAL NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE goals (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_savings REAL NOT NULL,
            target_date TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE memories (
            id TEXT PRIMARY KEY,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    # Populate transactions
    txs = generate_seed_transactions()
    cursor.executemany(
        """
        INSERT INTO transactions (id, date, merchant, amount, category, type, description, is_recurring)
        VALUES (:id, :date, :merchant, :amount, :category, :type, :description, :is_recurring)
        """,
        txs
    )

    # Populate budgets
    for cat, b in BUDGETS.items():
        cursor.execute("INSERT INTO budgets (category, monthly_budget) VALUES (?, ?)", (cat, b))

    # Populate goal
    cursor.execute(
        "INSERT INTO goals (id, name, target_amount, current_savings, target_date) VALUES (?, ?, ?, ?, ?)",
        ("goal_1", "Annual Emergency & Investment Fund", 25000.0, 16500.0, "2026-12-31")
    )

    conn.commit()
    return conn
