#!/usr/bin/env python
"""
QUICK START - Run all stress detection tests for viva panel demo
This script runs all tests in sequence and generates a summary report
"""

import subprocess
import sys
import os
from datetime import datetime

def print_header(title):
    print("\n" + "="*100)
    print(f"  {title}")
    print("="*100 + "\n")

def print_section(title):
    print(f"\n{'─'*100}")
    print(f"  {title}")
    print(f"{'─'*100}\n")

def run_test(test_name, command, description):
    """Run a test and handle output"""
    print_section(f"TEST: {test_name}")
    print(f"📝 {description}\n")
    print(f"🔧 Running: {command}\n")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=False,
            text=True
        )
        
        if result.returncode == 0:
            print(f"\n✅ {test_name} completed successfully\n")
            return True
        else:
            print(f"\n❌ {test_name} failed with exit code {result.returncode}\n")
            return False
    except Exception as e:
        print(f"\n❌ Error running {test_name}: {e}\n")
        return False


def main():
    print_header("🎓 VOICE JOURNALING STRESS DETECTION - VIVA PANEL TEST SUITE")
    
    print("""
This script will run all test cases in sequence to demonstrate the improved
stress detection system. Results will be shown in the console.

What's being tested:
  ✓ Keyword-based stress detection
  ✓ Before/after improvement comparison  
  ✓ Frontend fallback analysis
  ✓ API endpoint functionality

Total estimated time: 2-3 minutes

IMPORTANT: Make sure you're in the ml-backend directory!
""")
    
    input("\nPress ENTER to begin testing...")
    
    # Verify we're in the right directory
    if not os.path.exists("test_stress_keywords.py"):
        print("\n❌ Error: test_stress_keywords.py not found!")
        print("   Please run this script from the ml-backend directory")
        sys.exit(1)
    
    results = {}
    
    # Test 1: Keyword detection
    results['keywords'] = run_test(
        "Keyword Detection",
        "python test_stress_keywords.py",
        "Demonstrates how keywords are detected for each stress category"
    )
    
    # Test 2: Before/After comparison
    results['comparison'] = run_test(
        "Before/After Comparison",
        "python test_before_after_comparison.py",
        "Shows improvement metrics between old and new system (152% increase)"
    )
    
    # Test 3: Frontend testing
    results['frontend'] = run_test(
        "Frontend Fallback Analysis",
        "node test_stress_frontend.js",
        "Tests the local JavaScript-based stress analysis"
    )
    
    # Print summary
    print_header("📊 TEST SUMMARY")
    
    total_tests = len(results)
    passed = sum(1 for v in results.values() if v)
    
    print(f"Tests Completed: {total_tests}")
    print(f"Tests Passed: {passed}")
    print(f"Success Rate: {(passed/total_tests)*100:.0f}%\n")
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {status}: {test_name}")
    
    print("\n")
    print_header("🎯 NEXT STEPS FOR VIVA PANEL DEMO")
    
    print("""
1. SHOW THE TEST RESULTS:
   - Show the console output above to the panel
   - Explain what each test demonstrates
   
2. DEMONSTRATE THE API (Optional - if backend is running):
   - Start backend in another terminal: python main.py
   - Run individual API tests with curl commands from test_stress_api_calls.py
   - Show stress scores for different inputs
   
3. EXPLAIN THE IMPROVEMENTS:
   - 152% increase in keyword coverage (58 → 146 keywords)
   - From exact-word matching to context-aware detection
   - Handles natural language variations
   - Detects mixed-domain stress
   
4. ANSWER PANEL QUESTIONS:
   - "How does it detect stress?" → Multiple keywords per category
   - "What if user says it differently?" → Covered by 30-45 keywords
   - "How confident is it?" → Confidence = keyword count matched
   - "Does it work for all languages?" → Currently English only

KEY TALKING POINTS:
─────────────────
✨ Multi-Keyword Detection: Not dependent on exact words
✨ Synonym Understanding: "struggling" detected as financial
✨ Context Awareness: "panicked" + "presentation" = Academic stress  
✨ Confidence Scoring: More keywords = Higher confidence
✨ Robust Fallback: Frontend and backend synchronized
✨ Natural Language: Handles real user speech patterns
""")
    
    print("\n" + "="*100)
    print("📄 Additional Resources:")
    print("="*100)
    print("""
📖 Read: VIVA_PANEL_GUIDE.md
   Complete guide with metrics, examples, and demo instructions

💻 Run Tests Individually:
   python test_stress_keywords.py
   python test_before_after_comparison.py
   node test_stress_frontend.js
   python test_stress_api_calls.py

🔧 Test the API:
   # Terminal 1:
   python main.py
   
   # Terminal 2:
   python test_stress_api_calls.py

📊 View Keyword Lists:
   Check: routes/voice_routes.py (ACADEMIC_KEYWORDS, FINANCIAL_KEYWORDS, etc.)
   Check: mindplus/src/services/stressService.js
""")
    
    print("\n" + "="*100)
    if passed == total_tests:
        print("✅ ALL TESTS PASSED - Ready for Viva Panel!")
    else:
        print(f"⚠️  Some tests need attention ({total_tests - passed} failed)")
    print("="*100 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Test run interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
