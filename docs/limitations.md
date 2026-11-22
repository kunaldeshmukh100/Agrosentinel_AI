# System Limitations & Honest Disclosures

At AgroSentinel AI, we believe in radical transparency regarding the capabilities and limitations of our current prototype.

## Data & Modeling Limitations
- **Synthetic Fusion Training**: The multimodal fusion model was trained using simulated weather and geospatial data paired with real images. Real-world meteorological noise may affect the gating mechanism's accuracy in production.
- **PlantVillage Domain Gap**: The vision backbone is trained on the PlantVillage dataset, which consists of individual leaves photographed against uniform backgrounds in lab conditions. Performance will drop when farmers take photos of overlapping leaves with complex soil/sky backgrounds.
- **Satellite Feature Latency**: Satellite features (NDVI/EVI) are represented as pre-computed/static inputs in this MVP. In reality, optical satellite data is updated every 5-10 days and is often obscured by clouds during monsoon seasons.

## Geospatial & Infrastructure Limitations
- **GPS Accuracy Issues**: The system relies on the GPS coordinates provided by the farmer's mobile browser. This can be wildly inaccurate depending on the device, potentially misplacing reports and skewing the DBSCAN clustering.
- **No Real SMS Integration**: The "Alert Sent" feature in the MVP UI is a visual simulation. We have not yet integrated with a real telecom provider (like Twilio or AWS SNS) to send actual SMS warnings to farmers.
- **Environment Configuration**: The current repository is designed for local development. Docker containers and Kubernetes orchestrations have not been configured for cloud deployment yet.

## UX & Edge deployment
- **No Offline Mobile App**: The current farmer interface is a progressive web app (PWA) requiring internet access. Indian rural areas often have poor connectivity. A true offline React Native app with on-device edge inference is needed but not yet built.
- **Language Support**: The current MVP is exclusively in English. To be viable in India, localization into Marathi, Hindi, Telugu, etc., is required.
