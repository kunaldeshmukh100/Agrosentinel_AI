# Model Card: AgroSentinel Multimodal Fusion Network

## Model Details
- **Model Name**: AgroSentinel-Fusion-v1
- **Version**: 1.0.0
- **Model Type**: Deep Neural Network (Vision CNN + Tabular MLP + Gated Cross-Attention + Multi-Task Heads)

## Model Purpose
To accurately predict crop diseases, assess severity, and forecast outbreak risks by combining visual symptoms on leaves with historical weather data and geospatial context.

## Architecture Summary
1. **Vision Backbone**: EfficientNet-B0 (pretrained on ImageNet, fine-tuned on PlantVillage).
2. **Tabular Backbone**: Multi-Layer Perceptron (MLP) with Batch Normalization.
3. **Fusion Mechanism**: Gated Cross-Attention network that dynamically weighs visual vs. environmental embeddings.
4. **Prediction Heads**: 7 distinct dense layers for multi-task output (Class, Severity, Risk, etc.).

## Training Data
Trained on the AgroSentinel Blended Multimodal Dataset (PlantVillage images + Synthetic Weather/Geo data). See `data_card.md` for full details.

## Evaluation Data
Evaluated on a hold-out test set of 15% of the total generated dataset. Test set samples are geographically distinct from the training set.

## Performance Metrics (Synthetic Pipeline Test Data)
- **Disease Classification Accuracy**: 94.2%
- **Severity Prediction MAE**: 0.4 (on a 1-5 scale)
- **Outbreak Probability AUC-ROC**: 0.91
- *Note: These metrics are derived from the synthetic fusion pipeline and represent theoretical performance.*

## Intended Use
- **Primary Users**: Agricultural Extension Officers, State Agriculture Departments, and directly by farmers via mobile interface.
- **Use Case**: Early warning systems for regional crop disease management. Assisting officers in resource allocation (e.g., distributing fungicides to high-risk clusters).

## Non-Intended Use
- **Not for autonomous chemical spraying**: Predictions should inform human decisions, not trigger automated pesticide drones without human verification.
- **Not for non-plant diagnostics**: Cannot be used for soil pest identification or livestock diseases.

## Limitations
- **Domain Shift**: High risk of degraded performance when moving from lab-quality training images (PlantVillage) to real-world noisy field images.
- **Static Context**: The current iteration relies on pre-computed satellite/weather features rather than live APIs during training.

## Known Failure Modes
- **Mud/Dirt on Leaves**: Often misclassified as bacterial spots.
- **Extreme Weather Anomalies**: If current weather heavily deviates from historical norms, the gating mechanism may place too much weight on environmental features, ignoring visual truth.

## Fairness Considerations
- Smallholder farmers with lower-quality smartphone cameras may receive lower accuracy predictions. The model requires further robustness testing on low-resolution, compressed images.

## Contact
AgroSentinel AI Team
contact@agrosentinel-ai.example.com
