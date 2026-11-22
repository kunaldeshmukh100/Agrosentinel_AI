"""
AgroSentinel AI — Computer Vision Pipeline
EfficientNet-B0 based disease detection with embedding extraction.

Architecture:
  Image → Preprocess → EfficientNet-B0 → Disease Head
                                       → Severity Head
                                       → 128-dim Embedding (for fusion)
"""

import io
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms
from torchvision.models import EfficientNet_B0_Weights

logger = logging.getLogger(__name__)

# ── Disease Classes ────────────────────────────────────────────────────────────
DISEASE_CLASSES = [
    "healthy",
    "late_blight",
    "early_blight",
    "bacterial_spot",
    "septoria_leaf_spot",
    "leaf_mold",
    "spider_mites",
    "target_spot",
    "mosaic_virus",
    "yellow_leaf_curl_virus",
    "powdery_mildew",
    "downy_mildew",
    "rust",
    "anthracnose",
    "fusarium_wilt",
]

NUM_CLASSES = len(DISEASE_CLASSES)


# ── Model Architecture ─────────────────────────────────────────────────────────
class AgroSentinelVisionModel(nn.Module):
    """
    EfficientNet-B0 based crop disease detector.
    
    Three outputs:
    1. disease_logits: (B, num_classes) - disease classification
    2. severity:       (B, 1)           - continuous severity 0-1
    3. embedding:      (B, 128)         - compressed representation for fusion
    """

    def __init__(self, num_classes: int = NUM_CLASSES, dropout: float = 0.3):
        super().__init__()
        self.num_classes = num_classes

        # ── Backbone: EfficientNet-B0 ──────────────────────────────────────────
        # EfficientNet-B0 final feature size: 1280
        backbone = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
        
        # Remove the final classifier
        self.backbone = backbone.features  # Convolutional feature extractor
        self.adaptive_pool = nn.AdaptiveAvgPool2d(1)

        backbone_out_features = 1280  # EfficientNet-B0 output channels

        # ── Projection Head (to shared embedding space) ────────────────────────
        self.projection = nn.Sequential(
            nn.Linear(backbone_out_features, 256),
            nn.BatchNorm1d(256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
        )

        # ── Disease Classification Head ────────────────────────────────────────
        self.disease_head = nn.Sequential(
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(64, num_classes),
        )

        # ── Severity Regression Head ───────────────────────────────────────────
        self.severity_head = nn.Sequential(
            nn.Linear(128, 32),
            nn.GELU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),  # Output in [0, 1]
        )

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Args:
            x: Input images (B, 3, 224, 224)
        
        Returns:
            dict with keys: disease_logits, severity, embedding
        """
        # Feature extraction
        features = self.backbone(x)
        features = self.adaptive_pool(features)
        features = torch.flatten(features, 1)  # (B, 1280)

        # Project to shared embedding space
        embedding = self.projection(features)  # (B, 128)

        # Task-specific heads
        disease_logits = self.disease_head(embedding)  # (B, num_classes)
        severity = self.severity_head(embedding)       # (B, 1)

        return {
            "disease_logits": disease_logits,
            "severity": severity,
            "embedding": embedding,
        }


# ── Image Preprocessing ────────────────────────────────────────────────────────
def get_train_transform(image_size: int = 224) -> transforms.Compose:
    """Augmentation pipeline for training."""
    return transforms.Compose([
        transforms.RandomResizedCrop(image_size, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],  # ImageNet means
            std=[0.229, 0.224, 0.225]
        ),
    ])


def get_val_transform(image_size: int = 224) -> transforms.Compose:
    """Deterministic preprocessing for validation and inference."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])


# ── Image Quality Checks ───────────────────────────────────────────────────────
def check_image_quality(image: Image.Image) -> Tuple[bool, str]:
    """
    Basic image quality validation before inference.
    
    Returns:
        (is_valid, message)
    """
    # Check dimensions
    w, h = image.size
    if w < 64 or h < 64:
        return False, f"Image too small ({w}x{h}). Minimum 64x64 pixels."
    if w > 4096 or h > 4096:
        return False, f"Image too large ({w}x{h}). Maximum 4096x4096 pixels."

    # Check mode
    if image.mode not in ("RGB", "RGBA", "L"):
        return False, f"Unsupported image mode: {image.mode}"

    # Convert to RGB numpy for blur check
    img_array = np.array(image.convert("RGB"))

    # Laplacian-based blur detection
    import cv2
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 20:
        return False, f"Image appears blurry (sharpness score: {laplacian_var:.1f}). Please take a clearer photo."

    # Brightness check
    brightness = img_array.mean()
    if brightness < 15:
        return False, "Image is too dark. Please ensure adequate lighting."
    if brightness > 245:
        return False, "Image is overexposed. Please reduce lighting or move to shade."

    return True, "Image quality acceptable."


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """Load a PIL Image from raw bytes."""
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


# ── Inference Engine ───────────────────────────────────────────────────────────
class VisionInferenceEngine:
    """
    Manages model loading and inference.
    Singleton pattern — loaded once and reused.
    """

    def __init__(
        self,
        checkpoint_path: Optional[str] = None,
        device: Optional[str] = None,
    ):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Vision model using device: {self.device}")

        self.model = AgroSentinelVisionModel(num_classes=NUM_CLASSES)
        self.model.to(self.device)

        self.transform = get_val_transform()
        self.model_version = "vision_v0.1"
        self._loaded = False

        if checkpoint_path and Path(checkpoint_path).exists():
            self.load_checkpoint(checkpoint_path)
        else:
            logger.warning(
                f"No checkpoint found at {checkpoint_path}. "
                "Using untrained model — predictions will be random. "
                "Run scripts/train_vision_model.py to train."
            )
            self.model.eval()

    def load_checkpoint(self, path: str):
        """Load trained weights from checkpoint."""
        try:
            checkpoint = torch.load(path, map_location=self.device, weights_only=False)
            if "model_state_dict" in checkpoint:
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.model_version = checkpoint.get("version", "vision_v0.1")
            else:
                self.model.load_state_dict(checkpoint)
            self.model.eval()
            self._loaded = True
            logger.info(f"✅ Vision model loaded from {path} (version: {self.model_version})")
        except Exception as e:
            logger.error(f"Failed to load checkpoint: {e}")
            self.model.eval()

    @torch.no_grad()
    def predict(self, image_bytes: bytes) -> Dict:
        """
        Run full inference pipeline on raw image bytes.
        
        Returns:
            dict with: predicted_disease, disease_probability, severity_score,
                       all_probabilities, image_embedding, model_version, inference_time_ms
        """
        start_time = time.time()

        # Load and validate
        try:
            image = load_image_from_bytes(image_bytes)
        except Exception as e:
            return {"error": f"Failed to load image: {str(e)}"}

        is_valid, quality_msg = check_image_quality(image)
        if not is_valid:
            return {"error": quality_msg}

        # Preprocess
        tensor = self.transform(image).unsqueeze(0).to(self.device)  # (1, 3, 224, 224)

        # Inference
        outputs = self.model(tensor)

        # Post-process disease probabilities
        disease_probs = F.softmax(outputs["disease_logits"], dim=1)[0].cpu().numpy()
        predicted_idx = int(disease_probs.argmax())
        predicted_disease = DISEASE_CLASSES[predicted_idx]
        disease_probability = float(disease_probs[predicted_idx])

        # Severity
        severity_score = float(outputs["severity"][0, 0].cpu().item())

        # Embedding (for multimodal fusion)
        embedding = outputs["embedding"][0].cpu().numpy().tolist()

        elapsed_ms = (time.time() - start_time) * 1000

        return {
            "predicted_disease": predicted_disease,
            "disease_probability": round(disease_probability, 4),
            "severity_score": round(severity_score, 4),
            "all_probabilities": {
                cls: round(float(p), 4)
                for cls, p in zip(DISEASE_CLASSES, disease_probs)
            },
            "image_embedding": embedding,
            "model_version": self.model_version,
            "inference_time_ms": round(elapsed_ms, 1),
            "image_quality": quality_msg,
        }

    @torch.no_grad()
    def get_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        """Extract only the 128-dim embedding for multimodal fusion."""
        try:
            image = load_image_from_bytes(image_bytes)
            tensor = self.transform(image).unsqueeze(0).to(self.device)
            outputs = self.model(tensor)
            return outputs["embedding"][0].cpu().numpy().tolist()
        except Exception as e:
            logger.error(f"Embedding extraction failed: {e}")
            return None


# ── Grad-CAM Implementation ────────────────────────────────────────────────────
class GradCAM:
    """
    Gradient-weighted Class Activation Mapping.
    
    Highlights which image regions influenced the disease prediction.
    
    How it works:
    1. Forward pass to get prediction
    2. Backward pass to get gradients w.r.t. target layer activations
    3. Weight activation maps by global-average-pooled gradients
    4. Relu + normalize to get heatmap
    """

    def __init__(self, model: AgroSentinelVisionModel, target_layer_name: str = "backbone"):
        self.model = model
        self.gradients = None
        self.activations = None
        self._register_hooks(target_layer_name)

    def _register_hooks(self, layer_name: str):
        """Register forward and backward hooks on target layer."""
        # Get the last convolutional block of EfficientNet backbone
        target_layer = list(self.model.backbone.children())[-1]

        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        target_layer.register_forward_hook(forward_hook)
        target_layer.register_full_backward_hook(backward_hook)

    def generate(
        self, image_bytes: bytes, target_class: Optional[int] = None
    ) -> Optional[np.ndarray]:
        """
        Generate Grad-CAM heatmap for the given image.
        
        Args:
            image_bytes: Raw image bytes
            target_class: Class index to explain (None = predicted class)
        
        Returns:
            heatmap: numpy array (H, W) in range [0, 1], or None on failure
        """
        try:
            image = load_image_from_bytes(image_bytes)
            transform = get_val_transform()
            tensor = transform(image).unsqueeze(0).to(next(self.model.parameters()).device)

            self.model.eval()
            outputs = self.model(tensor)

            if target_class is None:
                target_class = outputs["disease_logits"].argmax(dim=1).item()

            # Compute gradient of target class score w.r.t. feature maps
            self.model.zero_grad()
            score = outputs["disease_logits"][0, target_class]
            score.backward()

            # Global average pool gradients
            weights = self.gradients.mean(dim=[2, 3], keepdim=True)  # (1, C, 1, 1)

            # Weighted combination of activation maps
            cam = (weights * self.activations).sum(dim=1, keepdim=True)  # (1, 1, H, W)
            cam = F.relu(cam)  # Remove negative contributions

            # Normalize to [0, 1]
            cam = cam.squeeze().cpu().numpy()
            if cam.max() > cam.min():
                cam = (cam - cam.min()) / (cam.max() - cam.min())
            else:
                cam = np.zeros_like(cam)

            return cam

        except Exception as e:
            logger.error(f"Grad-CAM generation failed: {e}")
            return None


# ── Module-level singleton ─────────────────────────────────────────────────────
_vision_engine: Optional[VisionInferenceEngine] = None


def get_vision_engine(checkpoint_path: Optional[str] = None) -> VisionInferenceEngine:
    """Get or create the vision inference engine singleton."""
    global _vision_engine
    if _vision_engine is None:
        _vision_engine = VisionInferenceEngine(checkpoint_path=checkpoint_path)
    return _vision_engine
