#!/usr/bin/env python3
"""
LCU Monitor Test Script
Simple test to verify the application components work correctly
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from lcu_client import LCUClient
from data_manager import DataManager

def test_lcu_connection():
    """Test LCU client connection"""
    print("Testing LCU Client Connection...")
    
    try:
        client = LCUClient()
        if client.is_connected():
            print("✅ LCU Client connected successfully")
            return True
        else:
            print("❌ Cannot connect to LCU - League Client may not be running")
            return False
    except Exception as e:
        print(f"❌ LCU Client error: {e}")
        return False

def test_data_manager():
    """Test data manager functionality"""
    print("\nTesting Data Manager...")
    
    try:
        client = LCUClient()
        if not client.is_connected():
            print("⚠️  Skipping data manager test - LCU not connected")
            return True
            
        manager = DataManager(client)
        
        # Test update
        updated = manager.update_game_data()
        if updated:
            print("✅ Data manager updated successfully")
        else:
            print("⚠️  No game data available (not in champion select)")
            
        # Test data retrieval
        data = manager.get_game_data()
        print(f"✅ Retrieved game data: {len(data)} items")
        
        return True
        
    except Exception as e:
        print(f"❌ Data manager error: {e}")
        return False

def test_components():
    """Test all components"""
    print("🔍 LCU Monitor Component Tests")
    print("=" * 50)
    
    tests = [
        ("LCU Connection", test_lcu_connection),
        ("Data Manager", test_data_manager),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(results)
    print(f"\nOverall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    return all_passed

if __name__ == "__main__":
    test_components()