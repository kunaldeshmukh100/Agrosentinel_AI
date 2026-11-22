# Future Development Roadmap

## Phase 1: MVP & Proof of Concept (Current Status)
- ✅ Foundational EfficientNet-B0 vision model trained.
- ✅ Synthetic multimodal dataset generator.
- ✅ Gated Cross-Attention fusion pipeline.
- ✅ DBSCAN geospatial clustering engine.
- ✅ FastAPI backend and React frontend dashboard.

## Phase 2: Real-World Ingestion & Edge App (Months 1-3)
- **Real Satellite Integration**: Connect to Google Earth Engine / Sentinel-2 APIs to pull live NDVI/EVI data based on incoming GPS coordinates.
- **Offline Mobile App**: Develop a React Native mobile application.
- **Edge Inference**: Convert the Vision model to ONNX/TFLite to run directly on the farmer's smartphone without internet access.
- **Pilot Data Collection**: Deploy to 100 pilot farmers to collect real-world, paired (Image + GPS) field data to replace synthetic training data.

## Phase 3: Graph Networks & Expansion (Months 4-6)
- **Graph Neural Networks (GNN)**: Upgrade from DBSCAN to Spatiotemporal GNNs. Farms become "nodes" and wind patterns become "edges" to predict exactly which neighbor will get infected tomorrow.
- **Crop Expansion**: Expand dataset beyond PlantVillage to include hyper-local Indian crops (e.g., Sugarcane, Cotton) by partnering with state agricultural universities.
- **Multi-Disease Detection**: Upgrade the model to handle multi-label classification for co-infections on a single plant.

## Phase 4: Hardware Integration & Scale (Months 7-12)
- **IoT Soil Sensor Integration**: Allow the fusion model to ingest live NPK and soil moisture data directly from on-farm hardware sensors.
- **Federated Learning**: Implement edge-training protocols where the model learns from a farmer's device without uploading their private photos to the central server.
- **Automated Alerting Pipeline**: Full integration with telecom APIs (Twilio/AWS SNS) to blast localized SMS warnings in regional languages (Marathi, Hindi) based on clustering thresholds.
