# Data Card: AgroSentinel AI Multimodal Dataset

## Dataset Overview
- **Dataset Name**: AgroSentinel Blended Multimodal Dataset (v1.0)
- **Source**: Blended from public datasets (PlantVillage) and synthetic data generation pipelines.
- **License**: Creative Commons Attribution-ShareAlike (CC BY-SA 4.0) for PlantVillage data. Synthetic data is proprietary to AgroSentinel AI.
- **Size**: ~54,000 images, combined with 54,000 corresponding synthetic multimodal records (weather, geospatial, satellite).

## PlantVillage Dataset Details
- Contains 54,303 healthy and unhealthy leaf images divided into 38 categorical classes (combinations of crop species and diseases).
- Used purely for training the foundational Vision (EfficientNet) model.

## Synthetic Dataset Description
Because real-world datasets combining leaf images, precise weather history, and GPS data do not exist at scale, we generate synthetic context:
- **Weather Generator**: Simulates realistic weather patterns (temperature, humidity, rainfall) correlated with specific fungal or bacterial diseases.
- **Geospatial Generator**: Simulates farm clusters using a Gaussian mixture model to mimic real-world disease spread dynamics.
- **Satellite Generator**: Generates NDVI/EVI approximations based on the crop health state.

## Geographic Coverage
- **Simulated Region**: Primarily modeled after the climatic and geospatial properties of Maharashtra, India (Nashik, Pune, Nagpur regions).

## Class Distribution
- The raw PlantVillage data is highly imbalanced (e.g., thousands of Tomato Late Blight images, but very few Squash Powdery Mildew).
- **Handling**: We apply stratified sampling and class-weighting in the loss function to prevent the model from biasing toward majority classes.

## Limitations
- **Synthetic Context**: The fusion model is trained on synthetic environmental data. While mathematically sound, it may lack the chaotic noise present in real-world meteorological data.
- **Lab Conditions**: PlantVillage images are mostly taken in lab settings with uniform backgrounds, which differs from cluttered, natural field backgrounds.

## Preprocessing Steps
- **Images**: Resized to 224x224, normalized to ImageNet mean/std, augmented with random flips, rotations, and color jitter.
- **Tabular Data**: Standard scaled (Z-score normalization) to ensure features like rainfall (mm) and humidity (%) are on the same scale.

## Train/Val/Test Split Strategy
- **Split Ratio**: 70% Train, 15% Validation, 15% Test.
- **Stratification**: Splitting is stratified based on the disease class to ensure all sets have representative samples of rare diseases.

## Data Leakage Prevention
- **Spatial Splitting**: To prevent spatial data leakage, test set farms are located in distinct geographic polygons separate from the training set polygons. This ensures the model learns generalizable features, not just memorizing specific locations.

## Privacy Considerations
- Real farmer data is not used in the initial training set.
- Any future ingested user data will have GPS coordinates truncated to 3 decimal places (approx. 100m accuracy) to protect exact farm locations before being used for retraining.
