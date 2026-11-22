import urllib.request, json

print("=== AgroSentinel AI - Full System Verification ===")
print()

# 1. Health
resp = urllib.request.urlopen("http://localhost:8000/api/v1/health")
h = json.loads(resp.read())
print(f"1. Health: {h['status']}  API v{h.get('version', '?')}")

# 2. Login
data = json.dumps({"email": "officer@demo.agrosentinel.ai", "password": "officer123"}).encode()
req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=data, headers={"Content-Type": "application/json"})
login = json.loads(urllib.request.urlopen(req).read())
print(f"2. Login: {login['name']} ({login['role']})")

# 3. Demo scenario
scenario = json.loads(urllib.request.urlopen("http://localhost:8000/api/v1/demo/scenario").read())
print(f"3. Demo scenario: {scenario['region']} | {scenario['crop']} | {scenario['disease']}")

# 4. Day-by-day demo
emoji_map = {"GREEN": "[GREEN]", "YELLOW": "[YELLOW]", "ORANGE": "[ORANGE]", "RED": "[RED]"}
for day in [1, 2, 3, 4, 5]:
    data = json.dumps({"session_id": "verify", "day": day}).encode()
    req = urllib.request.Request("http://localhost:8000/api/v1/demo/step", data=data, headers={"Content-Type": "application/json"})
    step = json.loads(urllib.request.urlopen(req).read())
    alert = step["alert_level"]
    cases = step["total_cases_cumulative"]
    risk = step["risk_summary"]["current_risk"]
    narrative = step["narrative"][:60]
    print(f"4. Day {day}: {emoji_map.get(alert, alert)} | {cases} cases | Risk: {risk:.2f} | {narrative}...")

# 5. Prediction
data = json.dumps({"latitude": 20.12, "longitude": 74.08, "crop_type": "tomato", "growth_stage": "flowering"}).encode()
req = urllib.request.Request("http://localhost:8000/api/v1/predict/", data=data, headers={"Content-Type": "application/json"})
pred = json.loads(urllib.request.urlopen(req).read())
print(f"5. Prediction: {pred['predicted_disease']} | Risk={pred['current_risk']} | {pred['alert_level']} | {pred['inference_time_ms']:.0f}ms")

# 6. What-if
data = json.dumps({"humidity": 88.0, "rainfall": 18.0, "nearby_cases": 7, "crop_stage": "flowering", "disease_probability": 0.7}).encode()
req = urllib.request.Request("http://localhost:8000/api/v1/demo/what-if", data=data, headers={"Content-Type": "application/json"})
whatif = json.loads(urllib.request.urlopen(req).read())
print(f"6. What-if: Before={whatif['before']['alert']} -> After={whatif['after']['alert']} | Delta={whatif['delta_pct']}")

print()
print("=== ALL SYSTEMS OPERATIONAL ===")
