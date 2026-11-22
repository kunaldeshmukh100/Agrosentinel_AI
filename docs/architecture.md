# AgroSentinel AI - System Architecture

## System Overview

```text
+-------------------+       +-------------------+       +--------------------+
|   Farmer Mobile   |       |  Officer Web App  |       |  External Sources  |
|  (React/PWA UI)   |       |  (Dashboard UI)   |       | (Meteostat, NASA)  |
+---------+---------+       +---------+---------+       +---------+----------+
          |                           |                           |
          v                           v                           v
+----------------------------------------------------------------------------+
|                                API Gateway                                 |
|                           (FastAPI REST API)                               |
+----------------------------------------------------------------------------+
          |                           |                           |
+---------v---------+       +---------v---------+       +---------v----------+
|  Ingestion &      |       |  ML Inference &   |       |  Geospatial &      |
|  Preprocessing    | ----> |  Multimodal Fusion| ----> |  Clustering Engine |
|  (Images/Text)    |       |  (PyTorch Models) |       |  (DBSCAN/GeoPandas)|
+---------+---------+       +---------+---------+       +---------+----------+
          |                           |                           |
          v                           v                           v
+----------------------------------------------------------------------------+
|                               Database Layer                               |
|                         (PostgreSQL / SQLite)                              |
+----------------------------------------------------------------------------+
```

## Component Descriptions
1. **Frontend (Mobile & Web)**: React-based applications for data collection by farmers and analytics dashboards for agricultural officers.
2. **API Layer**: FastAPI handles incoming requests, authentication, and orchestrates tasks.
3. **ML Pipeline**: Processes images (EfficientNet), structured data (XGBoost), and fuses them using a Gated Cross-Attention mechanism.
4. **Geospatial Engine**: Implements spatial clustering (DBSCAN) using GPS coordinates to identify localized outbreaks.
5. **Database**: Relational database to store reports, weather data, user profiles, and spatial information.

## Data Flow: Image → Alert
1. **Image Capture**: Farmer uploads a leaf image along with GPS coordinates and basic observations.
2. **Vision Processing**: EfficientNet-B0 extracts image embeddings.
3. **Context Enrichment**: System queries external APIs for real-time weather and satellite features (NDVI/EVI).
4. **Multimodal Fusion**: The Gated Cross-Attention model merges image, weather, and satellite embeddings.
5. **Risk Assessment**: The model predicts disease class, severity, and yield risk.
6. **Geospatial Clustering**: The prediction is mapped. DBSCAN identifies if nearby farms are experiencing the same disease.
7. **Alert Generation**: If an outbreak cluster is detected, an alert is sent to agricultural officers and neighboring farmers.

## API Layer Explanation
- Built with **FastAPI** for high performance and asynchronous execution.
- Endpoints:
  - `/api/predict`: Handles multimodal inference requests.
  - `/api/reports`: CRUD operations for farmer submissions.
  - `/api/clusters`: Retrieves DBSCAN outbreak clusters.
  - `/api/weather`: Fetches weather context based on lat/lon.

## Database Schema Overview
- **Users Table**: Stores farmer and officer credentials.
- **Reports Table**: `report_id`, `user_id`, `lat`, `lon`, `image_path`, `disease_class`, `severity`, `timestamp`.
- **Weather Table**: Cached weather data keyed by `(lat, lon, date)`.
- **Alerts Table**: Stores system-generated outbreak warnings.

## ML Pipeline Explanation
- **Stage 1 (Vision)**: Specialized model trained on PlantVillage.
- **Stage 2 (Fusion)**: Merges vision embeddings with environmental tabular data.
- **Output**: 7 distinct prediction heads including disease type, severity, and forecasted risk.

## Frontend Architecture
- **React.js** for web, easily adaptable to React Native for mobile.
- **State Management**: Redux or Context API.
- **Mapping**: Leaflet or Mapbox integration for the officer dashboard.

## Security Considerations
- **JWT Authentication** for all API endpoints.
- **Rate Limiting** to prevent API abuse.
- **Data Anonymization**: GPS coordinates fuzzed by 500m when sharing data publicly to protect farmer privacy.
