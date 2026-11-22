import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

print("SYNTHETIC DEMO DATA - for prototype demonstration only")

def generate_synthetic_data():
    np.random.seed(42)
    random.seed(42)

    # 1. Generate 500 farms
    num_farms = 500
    farm_ids = [f"FARM_{i:04d}" for i in range(num_farms)]
    # Nashik district area (lat 19.5-20.5, lon 73.5-74.5)
    latitudes = np.random.uniform(19.5, 20.5, num_farms)
    longitudes = np.random.uniform(73.5, 74.5, num_farms)
    crop_types = np.random.choice(["Tomato", "Grape", "Onion", "Pomegranate"], num_farms, p=[0.4, 0.3, 0.2, 0.1])
    
    farms_df = pd.DataFrame({
        "farm_id": farm_ids,
        "latitude": latitudes,
        "longitude": longitudes,
        "crop_type": crop_types
    })
    
    # 2. Weather records & Satellite features (for 60 days)
    start_date = datetime(2023, 8, 1)
    dates = [start_date + timedelta(days=i) for i in range(60)]
    
    weather_records = []
    satellite_records = []
    
    for farm_id in farm_ids:
        # Base weather patterns for farm
        base_temp = np.random.uniform(20, 25)
        base_humidity = np.random.uniform(60, 80)
        
        for d, date in enumerate(dates):
            temp = base_temp + np.random.normal(0, 2) + np.sin(d/10)*2
            humidity = base_humidity + np.random.normal(0, 5) + np.cos(d/10)*5
            humidity = min(max(humidity, 30), 100)
            rainfall = max(0, np.random.exponential(5) - 4) if np.random.random() > 0.7 else 0.0
            
            weather_records.append({
                "farm_id": farm_id,
                "timestamp": date.strftime("%Y-%m-%d"),
                "temperature_c": temp,
                "humidity_pct": humidity,
                "rainfall_mm": rainfall
            })
            
            # Satellite
            ndvi = np.random.uniform(0.3, 0.8)
            ndwi = np.random.uniform(-0.1, 0.3)
            satellite_records.append({
                "farm_id": farm_id,
                "timestamp": date.strftime("%Y-%m-%d"),
                "ndvi": ndvi,
                "ndwi": ndwi
            })

    weather_df = pd.DataFrame(weather_records)
    satellite_df = pd.DataFrame(satellite_records)
    
    # 3. Observations (2000+) & Clusters
    observations = []
    
    # Pre-select cluster centers for 10 outbreak clusters
    cluster_centers = farms_df.sample(10)
    cluster_info = []
    for idx, row in cluster_centers.iterrows():
        cluster_info.append({
            "cluster_id": f"CLUSTER_{len(cluster_info)+1}",
            "center_lat": row["latitude"],
            "center_lon": row["longitude"],
            "start_day": np.random.randint(5, 50)
        })
    
    # Generate observations over 60 days
    num_obs = 2500
    obs_farm_indices = np.random.randint(0, num_farms, num_obs)
    obs_days = np.random.randint(0, 60, num_obs)
    
    for i in range(num_obs):
        farm_idx = obs_farm_indices[i]
        day = obs_days[i]
        farm = farms_df.iloc[farm_idx]
        farm_id = farm["farm_id"]
        date = dates[day]
        
        # Weather for this farm on this day
        w = weather_df[(weather_df["farm_id"] == farm_id) & (weather_df["timestamp"] == date.strftime("%Y-%m-%d"))].iloc[0]
        s = satellite_df[(satellite_df["farm_id"] == farm_id) & (satellite_df["timestamp"] == date.strftime("%Y-%m-%d"))].iloc[0]
        
        # Growth stage & DAS
        das = np.random.randint(10, 120)
        stages = ["seedling", "vegetative", "flowering", "fruit_development", "maturity"]
        if das < 20: stage = "seedling"
        elif das < 50: stage = "vegetative"
        elif das < 80: stage = "flowering"
        elif das < 110: stage = "fruit_development"
        else: stage = "maturity"
        
        # Outbreak probability logic
        prob = 0.05
        # High humidity + warm temp
        if w["humidity_pct"] > 75 and 18 <= w["temperature_c"] <= 28:
            prob += 0.2
            
        # Cluster influence
        cluster_id = None
        nearby_cases = 0
        for c in cluster_info:
            if day >= c["start_day"]:
                dist = np.sqrt((farm["latitude"] - c["center_lat"])**2 + (farm["longitude"] - c["center_lon"])**2)
                if dist < 0.1: # approx 10km
                    prob += 0.3 * np.exp(-dist * 10) # decay with distance
                    cluster_id = c["cluster_id"]
                    nearby_cases = int((day - c["start_day"]) * np.random.uniform(0.5, 2.0))
                    
        # Noise
        prob += np.random.normal(0, 0.05)
        prob = min(max(prob, 0.01), 0.99)
        
        predicted_disease = np.random.choice(["Late Blight", "Early Blight", "Powdery Mildew", "None"], p=[0.4, 0.3, 0.2, 0.1]) if prob > 0.3 else "None"
        
        severity = 0.0
        if predicted_disease != "None":
            severity = np.random.uniform(0.1, 0.5)
            if stage in ["flowering", "fruit_development"]:
                severity += np.random.uniform(0.2, 0.4)
        severity = min(max(severity, 0.0), 1.0)
        
        observations.append({
            "farm_id": farm_id,
            "latitude": farm["latitude"],
            "longitude": farm["longitude"],
            "timestamp": date.strftime("%Y-%m-%d"),
            "crop_type": farm["crop_type"],
            "growth_stage": stage,
            "days_after_sowing": das,
            "predicted_disease": predicted_disease,
            "disease_probability": prob,
            "severity_score": severity,
            "temperature_c": w["temperature_c"],
            "humidity_pct": w["humidity_pct"],
            "rainfall_mm": w["rainfall_mm"],
            "ndvi": s["ndvi"],
            "ndwi": s["ndwi"],
            "nearby_cases_5km": nearby_cases,
            "cluster_id": cluster_id if cluster_id else "",
            "outbreak_risk": prob,
            "is_synthetic": True
        })
        
    obs_df = pd.DataFrame(observations)
    
    # 4. Outbreak Demo Scenario (Nashik Tomato Late Blight)
    # Day 1: 3, Day 2: 6, Day 3: 12, Day 4: 21, Day 5: 31 cases
    scenario_counts = [3, 6, 12, 21, 31]
    northeast_farms = farms_df[(farms_df["latitude"] > 20.0) & (farms_df["longitude"] > 74.0) & (farms_df["crop_type"] == "Tomato")].head(50)
    
    scenario_date = datetime(2023, 9, 15)
    selected_farms = []
    
    outbreak_dir = "data/synthetic"
    os.makedirs(outbreak_dir, exist_ok=True)
    
    for day_idx, count in enumerate(scenario_counts):
        day_date = scenario_date + timedelta(days=day_idx)
        # Select more farms as outbreak spreads
        new_farms = northeast_farms.iloc[len(selected_farms):count]
        selected_farms.extend(new_farms.to_dict('records'))
        
        scenario_obs = []
        for f in selected_farms:
            scenario_obs.append({
                "farm_id": f["farm_id"],
                "latitude": f["latitude"],
                "longitude": f["longitude"],
                "timestamp": day_date.strftime("%Y-%m-%d"),
                "crop_type": f["crop_type"],
                "growth_stage": "flowering",
                "days_after_sowing": 65,
                "predicted_disease": "Late Blight",
                "disease_probability": 0.85 + np.random.uniform(0, 0.1),
                "severity_score": 0.4 + (day_idx * 0.1) + np.random.uniform(0, 0.1),
                "temperature_c": 22.5 + np.random.normal(0, 1),
                "humidity_pct": 85.0 + np.random.normal(0, 2),
                "rainfall_mm": 5.0 + np.random.normal(0, 1),
                "ndvi": 0.6,
                "ndwi": 0.1,
                "nearby_cases_5km": count - 1,
                "cluster_id": "DEMO_CLUSTER_1",
                "outbreak_risk": 0.9,
                "is_synthetic": True
            })
            
        scenario_df = pd.DataFrame(scenario_obs)
        scenario_df.to_csv(f"{outbreak_dir}/outbreak_scenario_day{day_idx+1}.csv", index=False)

    # Save outputs
    farms_df.to_csv(f"{outbreak_dir}/farms.csv", index=False)
    weather_df.to_csv(f"{outbreak_dir}/weather.csv", index=False)
    satellite_df.to_csv(f"{outbreak_dir}/satellite_features.csv", index=False)
    obs_df.to_csv(f"{outbreak_dir}/observations.csv", index=False)
    
    # Save summary stats
    summary = {
        "num_farms": len(farms_df),
        "num_observations": len(obs_df),
        "num_clusters": len(cluster_info),
        "date_range": f"{start_date.strftime('%Y-%m-%d')} to {(start_date + timedelta(days=59)).strftime('%Y-%m-%d')}"
    }
    with open(f"{outbreak_dir}/summary.json", "w") as f:
        json.dump(summary, f, indent=4)
        
    print("Synthetic data generation complete. Files saved to data/synthetic/")

if __name__ == "__main__":
    generate_synthetic_data()
