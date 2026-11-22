"""
AgroSentinel AI — Gated Cross-Attention Multimodal Fusion Model

Architecture:
  6 Modality Encoders (each → 128-dim)
     ↓
  Modality-specific projection layers
     ↓  
  Gating Network (learns to weight each modality)
     ↓
  Cross-Attention Transformer Encoder (2 layers, 4 heads)
     ↓
  Multi-task prediction heads:
    - Disease classification (15 classes)
    - Severity regression (0-1)
    - Current outbreak risk (0-1)
    - Future risk 3d, 5d, 7d (0-1 each)
    - Spread probability (0-1)
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, Optional, List, Any
import logging

logger = logging.getLogger(__name__)

class ModalityGating(nn.Module):
    def __init__(self, num_modalities: int = 6):
        super().__init__()
        self.num_modalities = num_modalities
        self.gating_weights = nn.Parameter(torch.ones(num_modalities))

    def forward(self, modality_mask: torch.Tensor) -> torch.Tensor:
        """
        modality_mask: (B, num_modalities) boolean or float tensor (1 if present, 0 if missing)
        returns: (B, num_modalities) softmax-normalized gating weights
        """
        # Apply mask by masking out missing modalities with a large negative value
        mask = modality_mask.float()
        scores = self.gating_weights.unsqueeze(0) # (1, M)
        scores = scores.expand(mask.size(0), -1) # (B, M)
        
        # Mask out missing modalities
        scores = scores.masked_fill(mask == 0, -1e9)
        
        gates = F.softmax(scores, dim=-1)
        return gates

class MultimodalFusionModel(nn.Module):
    def __init__(self):
        super().__init__()
        
        # Projections
        self.image_proj = nn.Linear(128, 128)
        self.weather_proj = nn.Linear(14, 128)
        self.crop_proj = nn.Linear(4, 128)
        self.geo_proj = nn.Linear(6, 128)
        self.satellite_proj = nn.Linear(6, 128)
        self.historical_proj = nn.Linear(5, 128)
        
        # Null tokens for missing modalities
        self.null_image = nn.Parameter(torch.randn(1, 128))
        self.null_weather = nn.Parameter(torch.randn(1, 128))
        self.null_crop = nn.Parameter(torch.randn(1, 128))
        self.null_geo = nn.Parameter(torch.randn(1, 128))
        self.null_satellite = nn.Parameter(torch.randn(1, 128))
        self.null_historical = nn.Parameter(torch.randn(1, 128))
        
        # Gating
        self.gating = ModalityGating(6)
        
        # Transformer
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=128, nhead=4, dim_feedforward=256, dropout=0.1, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)
        
        # Prediction heads
        self.disease_head = nn.Linear(128, 15)
        self.severity_head = nn.Sequential(nn.Linear(128, 32), nn.ReLU(), nn.Linear(32, 1), nn.Sigmoid())
        self.risk_head = nn.Sequential(nn.Linear(128, 32), nn.ReLU(), nn.Linear(32, 1), nn.Sigmoid())
        self.risk_3d_head = nn.Sequential(nn.Linear(128, 16), nn.ReLU(), nn.Linear(16, 1), nn.Sigmoid())
        self.risk_5d_head = nn.Sequential(nn.Linear(128, 16), nn.ReLU(), nn.Linear(16, 1), nn.Sigmoid())
        self.risk_7d_head = nn.Sequential(nn.Linear(128, 16), nn.ReLU(), nn.Linear(16, 1), nn.Sigmoid())
        self.spread_head = nn.Sequential(nn.Linear(128, 16), nn.ReLU(), nn.Linear(16, 1), nn.Sigmoid())

    def forward(
        self,
        image_embedding: Optional[torch.Tensor] = None,
        weather_features: Optional[torch.Tensor] = None,
        crop_features: Optional[torch.Tensor] = None,
        geo_features: Optional[torch.Tensor] = None,
        satellite_features: Optional[torch.Tensor] = None,
        historical_features: Optional[torch.Tensor] = None
    ) -> Dict[str, torch.Tensor]:
        
        # Determine batch size from the first non-None tensor
        tensors = [image_embedding, weather_features, crop_features, geo_features, satellite_features, historical_features]
        batch_size = None
        device = next(self.parameters()).device
        
        for t in tensors:
            if t is not None:
                batch_size = t.size(0)
                device = t.device
                break
                
        if batch_size is None:
            raise ValueError("At least one modality must be provided.")
            
        # Modality mask
        mask = torch.zeros((batch_size, 6), device=device)
        
        # Project or use null tokens
        if image_embedding is not None:
            img_feat = self.image_proj(image_embedding)
            mask[:, 0] = 1.0
        else:
            img_feat = self.null_image.expand(batch_size, -1)
            
        if weather_features is not None:
            weather_feat = self.weather_proj(weather_features)
            mask[:, 1] = 1.0
        else:
            weather_feat = self.null_weather.expand(batch_size, -1)
            
        if crop_features is not None:
            crop_feat = self.crop_proj(crop_features)
            mask[:, 2] = 1.0
        else:
            crop_feat = self.null_crop.expand(batch_size, -1)
            
        if geo_features is not None:
            geo_feat = self.geo_proj(geo_features)
            mask[:, 3] = 1.0
        else:
            geo_feat = self.null_geo.expand(batch_size, -1)
            
        if satellite_features is not None:
            sat_feat = self.satellite_proj(satellite_features)
            mask[:, 4] = 1.0
        else:
            sat_feat = self.null_satellite.expand(batch_size, -1)
            
        if historical_features is not None:
            hist_feat = self.historical_proj(historical_features)
            mask[:, 5] = 1.0
        else:
            hist_feat = self.null_historical.expand(batch_size, -1)
            
        # Gating
        gates = self.gating(mask) # (B, 6)
        
        # Multiply features by gates and stack
        features = torch.stack([
            img_feat * gates[:, 0:1],
            weather_feat * gates[:, 1:2],
            crop_feat * gates[:, 2:3],
            geo_feat * gates[:, 3:4],
            sat_feat * gates[:, 4:5],
            hist_feat * gates[:, 5:6]
        ], dim=1) # (B, 6, 128)
        
        # Transformer
        encoded = self.transformer(features) # (B, 6, 128)
        
        # Global Average Pooling
        pooled = encoded.mean(dim=1) # (B, 128)
        
        # Prediction Heads
        disease_logits = self.disease_head(pooled)
        severity = self.severity_head(pooled).squeeze(-1)
        current_risk = self.risk_head(pooled).squeeze(-1)
        risk_3d = self.risk_3d_head(pooled).squeeze(-1)
        risk_5d = self.risk_5d_head(pooled).squeeze(-1)
        risk_7d = self.risk_7d_head(pooled).squeeze(-1)
        spread = self.spread_head(pooled).squeeze(-1)
        
        return {
            "disease_logits": disease_logits,
            "disease_classification": torch.argmax(disease_logits, dim=-1),
            "severity": severity,
            "current_risk": current_risk,
            "future_risk_3d": risk_3d,
            "future_risk_5d": risk_5d,
            "future_risk_7d": risk_7d,
            "spread_probability": spread,
            "modality_gates": gates
        }

class FusionInferenceEngine:
    def __init__(self, device: str = "cpu"):
        self.device = torch.device(device)
        self.model = MultimodalFusionModel().to(self.device)
        self.model.eval()

    def load_checkpoint(self, path: str):
        try:
            self.model.load_state_dict(torch.load(path, map_location=self.device))
            logger.info(f"Loaded checkpoint from {path}")
        except Exception as e:
            logger.error(f"Failed to load checkpoint: {e}")
            raise

    def predict(
        self,
        image_embedding: Optional[np.ndarray] = None,
        weather_features: Optional[np.ndarray] = None,
        crop_features: Optional[np.ndarray] = None,
        geo_features: Optional[np.ndarray] = None,
        satellite_features: Optional[np.ndarray] = None,
        historical_features: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        
        def to_tensor(arr):
            if arr is not None:
                return torch.FloatTensor(arr).unsqueeze(0).to(self.device)
            return None
            
        with torch.no_grad():
            outputs = self.model(
                image_embedding=to_tensor(image_embedding),
                weather_features=to_tensor(weather_features),
                crop_features=to_tensor(crop_features),
                geo_features=to_tensor(geo_features),
                satellite_features=to_tensor(satellite_features),
                historical_features=to_tensor(historical_features)
            )
            
        # Convert outputs back to CPU numpy / python types
        result = {}
        for k, v in outputs.items():
            if isinstance(v, torch.Tensor):
                result[k] = v.cpu().numpy().tolist()
                
        # Unpack single element batches for simplicity
        for k in ["severity", "current_risk", "future_risk_3d", "future_risk_5d", "future_risk_7d", "spread_probability"]:
            if k in result:
                result[k] = result[k][0]
                
        if "disease_classification" in result:
            result["disease_classification"] = result["disease_classification"][0]
            
        if "modality_gates" in result:
            gates = result["modality_gates"][0]
            result["modality_gates_dict"] = {
                "image": gates[0],
                "weather": gates[1],
                "crop": gates[2],
                "geo": gates[3],
                "satellite": gates[4],
                "historical": gates[5]
            }
            
        return result

    def get_alert_level(self, risk_score: float) -> str:
        if risk_score < 0.3:
            return "GREEN"
        elif risk_score < 0.6:
            return "YELLOW"
        elif risk_score < 0.8:
            return "ORANGE"
        else:
            return "RED"

    def generate_explanation(self, modality_gates: Dict[str, float], weather_features: Optional[np.ndarray], geo_features: Optional[np.ndarray]) -> str:
        # Find most important modality
        top_modality = max(modality_gates.items(), key=lambda x: x[1])[0]
        
        explanation = f"The model heavily relied on {top_modality} data for this prediction. "
        
        if top_modality == "weather" and weather_features is not None:
            explanation += "Current weather conditions appear highly conducive to disease spread. "
            
        if top_modality == "geo" and geo_features is not None:
            explanation += "The geographical location shows a high historical susceptibility. "
            
        return explanation
