"""
API Test: Voice Journaling Stress Analysis Endpoint
"""

import requests
import json

API_URL = "http://localhost:8000/voice/analyze-stress"

test_cases = [
    {
        "name": "Financial Stress",
        "user_id": "test_user_001",
        "text": "I'm struggling to pay my bills and rent. My salary is too low.",
        "expected_dominant": "Financial",
    },
    {
        "name": "Academic Stress",
        "user_id": "test_user_002",
        "text": "I have assignments and presentations. I'm worried about grades.",
        "expected_dominant": "Academic",
    },
    {
        "name": "Social Stress",
        "user_id": "test_user_003",
        "text": "My partner abandoned me and I feel lonely.",
        "expected_dominant": "Social",
    },
    {
        "name": "Emotional Stress",
        "user_id": "test_user_004",
        "text": "I feel depressed and anxious and overwhelmed.",
        "expected_dominant": "Emotional",
    },
]

print("=" * 80)
print("🎤 VOICE JOURNALING API TEST")
print("=" * 80)

# ✅ Print test cases
for i, test in enumerate(test_cases, 1):
    print(f"\nTest {i}: {test['name']}")
    print(f"Text: {test['text']}")
    print(f"Expected: {test['expected_dominant']}")

# ✅ Run actual API tests
print("\n" + "=" * 80)
print("🚀 RUNNING API CALLS")
print("=" * 80)

for test in test_cases:
    payload = {
        "user_id": test["user_id"],
        "text": test["text"],
        "audio_url": None
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=10)

        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ {test['name']}")
            print(f"Detected: {data.get('dominant_type')}")
            print(f"Confidence: {data.get('confidence')}")
            print(f"Scores: {data.get('stress_scores')}")
        else:
            print(f"\n❌ {test['name']} - Status {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"\n❌ {test['name']} - Error: {str(e)}")

print("\n" + "=" * 80)
print("Done")