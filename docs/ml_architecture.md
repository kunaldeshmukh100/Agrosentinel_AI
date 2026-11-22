# Machine Learning Architecture

## Vision Model
- **Architecture**: EfficientNet-B0
- **Why Chosen**: EfficientNet-B0 provides an excellent tradeoff between accuracy and computational efficiency. Since we aim for potential edge deployment or low-latency cloud inference, this lightweight model is ideal.
- **Input**: 224x224 RGB image of a crop leaf.
- **Output**: A 1280-dimensional feature embedding vector, plus a classification head for baseline disease prediction.

## Weather Model
- **Architecture**: We utilize tabular feature processing combined with XGBoost or deep MLPs for tabular embeddings.
- **Feature List & Engineering**: 
  - Temperature (Max, Min, Avg)
  - Humidity (Relative humidity at 2m)
  - Precipitation (Daily cumulative)
  - Wind Speed
  - Rolling averages (7-day, 14-day) to capture temporal weather trends conducive to fungal/bacterial growth.

## Multimodal Fusion: Gated Cross-Attention
In simple terms, Gated Cross-Attention allows the model to decide *how much* one type of data (e.g., weather) should influence the interpretation of another type of data (e.g., an image).

- **Mechanism**: The image embedding acts as the "Query", while weather/satellite embeddings act as "Keys" and "Values". The network learns to pay attention to specific environmental factors based on the visual symptoms.
- **Gating**: A learned gate (value between 0 and 1) controls the flow of information. If the image is clear and definitive, the gate might restrict environmental influence. If the image is ambiguous, the gate opens to let weather context heavily weigh in on the prediction.

## Missing Modality Handling
Real-world deployments often face missing data (e.g., API failures for weather).
- **Strategy**: We train the fusion model with dropout on specific modalities. During inference, if weather data is missing, we substitute it with a learned `[MASK]` embedding or zeros, and the gating mechanism naturally learns to ignore it, relying solely on the available modalities (image + spatial).

## Multi-Task Learning Rationale
Instead of just predicting the disease, our fusion model predicts 7 distinct tasks:
1. Disease Class
2. Disease Severity
3. Yield Risk (Low/Med/High)
4. Outbreak Probability
5. Treatment Recommendation Category
6. Spread Velocity
7. Next 7-Day Risk

**Why?** Multi-task learning acts as a regularizer. By forcing the shared hidden layers to learn representations useful for all these tasks, the model generalizes better and avoids overfitting to just the disease class.

## Training Strategy
- **Stage 1**: Train the EfficientNet-B0 vision model on the PlantVillage dataset for standard image classification.
- **Stage 2**: Freeze or apply low learning rate to the vision backbone. Extract embeddings.
- **Stage 3**: Train the Gated Cross-Attention fusion model and the Multi-Task heads on the synthetic/multimodal dataset, using a combined loss function (e.g., CrossEntropy for class, MSE for severity).
