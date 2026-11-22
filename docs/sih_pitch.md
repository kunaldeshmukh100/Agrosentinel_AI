# AgroSentinel AI - SIH Pitch Presentation

## SLIDE 1: Title
**AgroSentinel AI**
*Multimodal AI-Based Crop Disease Outbreak Early-Warning and Forecasting System*
**Team**: [Your Team Name]
**Institution**: [Your Institution]
**SIH Problem Statement**: [Insert Problem Statement ID/Name]

## SLIDE 2: Problem Statement
- **The Core Problem**: Current Ag-Tech apps provide isolated, one-off diagnoses. They act as a magnifying glass, but governments need a radar. 
- **Image Classification is Insufficient**: A yellowing leaf could be a contagious fungus or simple nitrogen deficiency. An image alone cannot tell you if an epidemic is brewing.
- **Outbreak vs. Isolated Case**: 1 sick plant is a farmer's problem. 100 sick plants in a 5km radius is a government emergency.
- **Economic Impact**: Delayed detection of pests like Fall Armyworm or Late Blight costs billions in crop loss annually. Early intervention is impossible without real-time spatial intelligence.

## SLIDE 3: Proposed Solution
- **AgroSentinel AI Overview**: A unified ecosystem that bridges farmer-level diagnosis with state-level epidemic forecasting.
- **The Pipeline**: Detection (Farmer App) → Context Fusion (AI) → Spatial Clustering (DBSCAN) → Forecast (Risk Model) → Alert (Dashboard/SMS).
- **Farmer Workflow**: Snap a photo. Get immediate treatment advice.
- **Officer Dashboard**: View real-time heatmaps, track disease velocity, and preemptively deploy resources.

## SLIDE 4: Technical Approach
- **6 Modalities Fused**: Image, Lat/Lon, Temperature, Humidity, Rainfall, Satellite Vegetation Indices.
- **Vision Model**: EfficientNet-B0 (Lightweight, edge-deployable).
- **Fusion Engine**: Gated Cross-Attention Transformer. The model learns *when* to trust the image and *when* to rely on weather context.
- **Geospatial Engine**: DBSCAN spatial clustering dynamically identifies outbreaks without needing predefined zones.
- **Multi-task Learning**: 7 simultaneous prediction heads (Disease, Severity, Yield Risk, Spread Velocity, etc.) ensuring robust feature learning.

## SLIDE 5: Innovation + Feasibility + Impact
- **Core Innovation**: Spatiotemporal Multimodal Outbreak Intelligence. Moving from reactive "What is this disease?" to proactive "Where is this disease going tomorrow?"
- **Feasibility**: Designed for standard cloud infrastructure. Works asynchronously. No expensive cloud GPUs required for inference.
- **Impact**: Early warning translates directly to early intervention, drastically reducing chemical overuse and preventing widespread crop failure. 
- **Target**: 100M+ Indian smallholder farmers and state agricultural departments.

## SLIDE 6: References + Future Roadmap
- **References**: 
  - Hughes, D.P., et al. (PlantVillage Dataset).
  - Ester, M., et al. (DBSCAN Clustering).
  - Recent advances in Multimodal Transformers (Vaswani et al.).
- **Future Roadmap**: Integration of Graph Neural Networks (GNN) for farm-to-farm spread modeling, IoT soil sensor integration, and Federated Learning for data privacy.
- **Elevator Pitch (30s)**: "AgroSentinel turns every farmer's smartphone into a node in a national biosecurity radar, stopping crop diseases before they become famines."

---

## JUDGE Q&A (20 Honest, Technical Answers)

1. **How is this different from existing apps like Plantix?**
   Existing apps are single-player image classifiers. AgroSentinel is a multiplayer epidemiological tracker. We fuse weather and spatial data to find outbreaks, not just diagnose single leaves.
2. **What if the weather API goes down?**
   Our fusion model is trained with missing-modality dropout. If weather data is unavailable, the gating mechanism dynamically shifts 100% attention to the visual and spatial embeddings.
3. **How do you handle poor internet in rural areas?**
   The MVP requires internet. Future phases will deploy quantized versions of EfficientNet directly on the mobile device (via ONNX/TFLite) for offline diagnosis, syncing spatial data when internet is restored.
4. **Why EfficientNet-B0 and not ResNet50?**
   EfficientNet-B0 achieves similar accuracy to ResNet50 but with significantly fewer parameters (5.3M vs 25M), making it faster, cheaper to run on cloud, and ready for edge deployment.
5. **How did you get the multimodal data?**
   Since large-scale, paired multimodal agricultural data isn't publicly available, we used PlantVillage images and engineered a synthetic generation pipeline for weather/GPS data to simulate real-world correlations.
6. **What is DBSCAN and why use it?**
   It's a density-based clustering algorithm. Unlike K-Means, it doesn't require us to guess the number of outbreaks in advance, and it easily filters out isolated, non-threat reports as "noise."
7. **What is Gated Cross-Attention?**
   It's a neural network mechanism that lets the model "weigh" the importance of different data. If a visual symptom is ambiguous, the gate opens to let high humidity data drive the prediction of a fungal disease.
8. **Are farmers willing to share their GPS data?**
   Privacy is a concern. We truncate GPS coordinates to 500m precision on the backend before storing them, ensuring regional trends are captured without exposing exact farm locations.
9. **How do you prevent false outbreak alerts?**
   Our DBSCAN parameters require a minimum threshold of reports (e.g., 3 cases within 5km) within a tight time window. A single misclassified image won't trigger state-wide panic.
10. **Does it work on all crops?**
    The current MVP supports 14 crops (based on PlantVillage). The architecture is scalable; adding a new crop requires fine-tuning the vision backbone with new data.
11. **How do you handle different lighting conditions in images?**
    During training, we apply aggressive data augmentation: color jittering, random brightness, contrast adjustments, and Gaussian noise to make the model robust to bad mobile photography.
12. **Why multi-task learning?**
    Training the model to predict severity and risk *alongside* disease class forces the hidden layers to learn richer representations, which prevents overfitting and improves overall accuracy.
13. **Is the system cloud-heavy/expensive?**
    No. The backend is an asynchronous FastAPI app. Inference takes milliseconds on a standard CPU. We do not require constant GPU runtime in production.
14. **How do you validate the satellite features?**
    Currently, we use simulated NDVI/EVI values correlated with disease severity. In production, we will integrate with Google Earth Engine or Sentinel APIs to pull live indices.
15. **What if multiple diseases infect the same plant?**
    This is a limitation. Currently, our vision backbone outputs a single most-likely class (Softmax). Future iterations will shift to multi-label classification (Sigmoid) to detect co-infections.
16. **How does the system benefit the government?**
    It provides a real-time dashboard showing disease velocity. Instead of waiting for weekly manual surveys, officers can see outbreaks forming and dispatch targeted fungicide subsidies.
17. **What tech stack did you use?**
    React for frontend, FastAPI (Python) for the backend, PyTorch for the ML pipeline, and GeoPandas/Scikit-learn for spatial analytics.
18. **How do you prevent data leakage in training?**
    We split our train/test sets spatially. Farms in the test set are in different geographic polygons than the train set, proving the model generalizes to new regions.
19. **What is your accuracy?**
    On our synthetic multimodal test set, classification accuracy is 94.2%. However, we acknowledge this will drop when applied to real-world, noisy field data.
20. **What is the immediate next step if you win SIH?**
    Phase 2: Partnering with a local KVK (Krishi Vigyan Kendra) to collect real-world paired data (image + GPS) in Maharashtra to replace our synthetic dataset and train the production model.
