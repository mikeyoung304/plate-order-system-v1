#!/usr/bin/env python3
"""
Script to create daily specials for testing the quick-select features
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:10000"

# Daily specials for each meal period
SPECIALS = {
    "breakfast": {
        "name": "Belgian Waffle Platter",
        "description": "Fluffy Belgian waffles served with fresh berries, maple syrup, and whipped cream"
    },
    "lunch": {
        "name": "Herb Roasted Chicken",
        "description": "Tender herb-roasted chicken with seasonal vegetables and garlic mashed potatoes"
    },
    "dinner": {
        "name": "Grilled Salmon",
        "description": "Fresh grilled salmon with lemon butter sauce, wild rice pilaf, and steamed asparagus"
    }
}

def create_todays_specials():
    """Create daily specials for today (all meal periods)"""
    headers = {"Content-Type": "application/json"}
    today = datetime.now().strftime("%Y-%m-%d")
    
    for meal_period, special in SPECIALS.items():
        print(f"Creating {meal_period} special for {today}...")
        
        data = {
            "meal_period": meal_period,
            "name": special["name"],
            "description": special["description"]
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/daily-specials/",
                headers=headers,
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                print(f"✅ Successfully created {meal_period} special")
            else:
                print(f"❌ Failed to create {meal_period} special: {response.text}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")

def create_future_specials(days=7):
    """Create specials for the next few days"""
    headers = {"Content-Type": "application/json"}
    
    for day in range(1, days + 1):
        future_date = (datetime.now() + timedelta(days=day)).strftime("%Y-%m-%d")
        
        for meal_period, special in SPECIALS.items():
            print(f"Creating {meal_period} special for {future_date}...")
            
            # Modify the name to indicate it's a future special
            modified_name = f"{special['name']} ({day} days ahead)"
            
            data = {
                "meal_period": meal_period,
                "name": modified_name,
                "description": special["description"]
            }
            
            try:
                response = requests.post(
                    f"{BASE_URL}/api/daily-specials/",
                    headers=headers,
                    data=json.dumps(data)
                )
                
                if response.status_code == 200:
                    print(f"✅ Successfully created {meal_period} special for {future_date}")
                else:
                    print(f"❌ Failed to create {meal_period} special for {future_date}: {response.text}")
            except Exception as e:
                print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Create daily specials for testing")
    parser.add_argument("--future", type=int, default=0, help="Create specials for future days (default: 0)")
    args = parser.parse_args()
    
    create_todays_specials()
    
    if args.future > 0:
        create_future_specials(args.future) 