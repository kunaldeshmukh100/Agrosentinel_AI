# Demo Walkthrough Guide

## How to Access the Demo
Ensure both the backend API (Port 8000) and frontend React app (Port 3000) are running.
Navigate to `http://localhost:3000` in your browser.

## Demo Scenario Description (Nashik Tomato Late Blight)
**The Scenario**: It is early monsoon season in Nashik, Maharashtra. High humidity and moderate temperatures have created the perfect breeding ground for *Phytophthora infestans* (Late Blight). 
A few farmers have noticed spots on their tomato crops. We will show how AgroSentinel connects these isolated reports to predict a regional outbreak.

## Step-by-Step Demo Instructions

### 1. Farmer Submission (The "Input")
- Go to the **Farmer Portal** (`/farmer`).
- Upload the test image located at `test_images/tomato_blight_1.jpg`.
- Set location to Nashik (Lat: 20.00, Lon: 73.78).
- Click **Analyze**.
- **What happens**: The UI shows the prediction, severity, and immediate treatment advice.

### 2. The Officer Dashboard (The "Intelligence")
- Log in to the **Dashboard** (`/login`) using demo credentials.
- Navigate to the **Live Map**.
- **What to point out**: Show the red clusters. Explain that DBSCAN has aggregated the recent submission with 4 other simulated reports in a 5km radius.
- Click on the cluster to view the **Outbreak Intelligence Report**.

### 3. Multimodal Explanation
- Open a specific report from the cluster.
- Show the **"Why did the AI decide this?"** section.
- Point out how the model highlights the recent 3-day rainfall and 85% humidity as heavily weighted factors (the Gated Cross-Attention mechanism at work).

## What to Show to the Jury
- **The map clustering**: Emphasize that this is spatial intelligence, not just image classification.
- **Multi-task outputs**: Show that we predict *severity* and *velocity of spread*, not just the disease name.
- **Speed**: The inference happens in milliseconds despite using multiple modalities.

## What-If Simulator Guide
- Go to the **Simulation Tab**.
- Change the weather inputs (e.g., drop humidity to 40%).
- Run the simulation to show how the "Risk of Spread" drops to Low. 
- *Talking Point*: "This allows agricultural departments to do predictive scenario planning based on next week's weather forecast."

## Key Talking Points
- "We don't just tell the farmer their plant is sick; we tell the government an epidemic is starting."
- "By fusing satellite, weather, and image data, we reduce false positives drastically."
- "The system works asynchronously; if weather APIs go down, the model dynamically falls back to relying purely on image and location data."
