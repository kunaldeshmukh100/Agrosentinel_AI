"""
AgroSentinel AI — Vision Model Training Script

This script trains EfficientNet-B0 for crop disease classification.

Strategy:
  Stage 1: Train classification head with frozen backbone (5 epochs)
  Stage 2: Fine-tune last 3 backbone blocks (10 epochs)
  Stage 3: Extract and save embeddings

Usage:
  python scripts/train_vision_model.py

If PlantVillage dataset is not available, uses synthetic colored patches
to demonstrate the training pipeline works correctly.
"""

import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms
from PIL import Image

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "apps" / "api"))

from ml.vision.vision_model import (
    AgroSentinelVisionModel, DISEASE_CLASSES, NUM_CLASSES,
    get_train_transform, get_val_transform
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────
CHECKPOINT_DIR = project_root / "models" / "checkpoints"
CHECKPOINT_PATH = CHECKPOINT_DIR / "vision_model.pt"
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Training device: {DEVICE}")

IMAGE_SIZE = 224
BATCH_SIZE = 16 if DEVICE == "cpu" else 32
STAGE1_EPOCHS = 5
STAGE2_EPOCHS = 10


# ── Synthetic Dataset (fallback when PlantVillage not available) ───────────────
class SyntheticCropDataset(Dataset):
    """
    Generates synthetic colored patches to simulate crop disease images.
    Used to demonstrate the training pipeline when real images are not available.
    
    IMPORTANT: This dataset is purely synthetic and does NOT produce a useful
    disease detector. It is only used to prove the training code works correctly.
    Train with real PlantVillage data for actual disease detection.
    """

    def __init__(
        self,
        num_samples: int = 2000,
        image_size: int = 224,
        transform=None,
        split: str = "train",
        seed: int = 42
    ):
        np.random.seed(seed)
        torch.manual_seed(seed)

        self.num_samples = num_samples
        self.image_size = image_size
        self.transform = transform or get_val_transform(image_size)

        # Generate labels
        self.labels = np.random.randint(0, NUM_CLASSES, size=num_samples)

        # Each class has a characteristic color tint for learnability
        self.class_colors = [
            [0.5, 0.8, 0.3],   # healthy - green
            [0.8, 0.4, 0.2],   # late_blight - brownish
            [0.9, 0.7, 0.1],   # early_blight - yellowish
            [0.6, 0.3, 0.3],   # bacterial_spot - dark
            [0.7, 0.6, 0.2],   # septoria
            [0.4, 0.7, 0.5],   # leaf_mold
            [0.8, 0.3, 0.5],   # spider_mites
            [0.6, 0.5, 0.3],   # target_spot
            [0.5, 0.5, 0.8],   # mosaic_virus
            [0.9, 0.9, 0.2],   # yellow_leaf_curl
            [0.9, 0.9, 0.9],   # powdery_mildew
            [0.4, 0.6, 0.8],   # downy_mildew
            [0.8, 0.5, 0.2],   # rust
            [0.5, 0.3, 0.2],   # anthracnose
            [0.6, 0.4, 0.6],   # fusarium_wilt
        ]

        logger.warning(
            "⚠️  Using SYNTHETIC image dataset. "
            "This is for pipeline testing ONLY. "
            "Download PlantVillage for real disease detection."
        )

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        label = int(self.labels[idx])
        
        # Generate a noisy colored patch
        base_color = self.class_colors[label]
        noise = np.random.randn(self.image_size, self.image_size, 3) * 0.15
        img_array = np.clip(
            np.ones((self.image_size, self.image_size, 3)) * base_color + noise,
            0, 1
        )
        
        # Add some texture-like patterns
        x = np.linspace(0, np.pi * 4, self.image_size)
        pattern = np.sin(x + label) * 0.1
        img_array[:, :, 0] += pattern.reshape(1, -1)
        img_array = np.clip(img_array, 0, 1)
        
        img = Image.fromarray((img_array * 255).astype(np.uint8))
        
        # Synthetic severity (correlated with class index)
        severity = float(label) / NUM_CLASSES * 0.9 + np.random.uniform(-0.1, 0.1)
        severity = float(np.clip(severity, 0.0, 1.0))
        
        if self.transform:
            img = self.transform(img)
        
        return img, label, torch.tensor([severity], dtype=torch.float32)


class PlantVillageDataset(Dataset):
    """
    Dataset loader for PlantVillage/PlantDoc image datasets.
    
    Expected folder structure:
        data/raw/plantvillage/
            tomato_late_blight/  (or similar subfolder names)
                image1.jpg
                ...
            healthy/
                ...
    
    Maps folder names to our DISEASE_CLASSES labels.
    """

    FOLDER_TO_CLASS = {
        "healthy": "healthy",
        "tomato_late_blight": "late_blight",
        "tomato_early_blight": "early_blight",
        "tomato_bacterial_spot": "bacterial_spot",
        "tomato_septoria_leaf_spot": "septoria_leaf_spot",
        "tomato_leaf_mold": "leaf_mold",
        "tomato_spider_mites": "spider_mites",
        "tomato_target_spot": "target_spot",
        "tomato_mosaic_virus": "mosaic_virus",
        "tomato_yellow_leaf_curl_virus": "yellow_leaf_curl_virus",
        # Add more mappings as needed
    }

    def __init__(self, data_dir: str, transform=None):
        self.data_dir = Path(data_dir)
        self.transform = transform or get_val_transform()
        self.samples = []  # (image_path, label_idx)

        for folder in self.data_dir.iterdir():
            if folder.is_dir():
                # Map folder name to disease class
                class_name = self.FOLDER_TO_CLASS.get(folder.name.lower(), "healthy")
                label_idx = DISEASE_CLASSES.index(class_name) if class_name in DISEASE_CLASSES else 0

                for img_file in folder.glob("*.jpg"):
                    self.samples.append((str(img_file), label_idx))
                for img_file in folder.glob("*.JPG"):
                    self.samples.append((str(img_file), label_idx))
                for img_file in folder.glob("*.png"):
                    self.samples.append((str(img_file), label_idx))

        logger.info(f"PlantVillage dataset: {len(self.samples)} images found")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        try:
            img = Image.open(img_path).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), color=(128, 128, 128))

        severity = 0.3 + (label / NUM_CLASSES) * 0.5  # Heuristic
        if self.transform:
            img = self.transform(img)

        return img, label, torch.tensor([float(severity)], dtype=torch.float32)


# ── Loss Function ──────────────────────────────────────────────────────────────
class MultiTaskLoss(nn.Module):
    """Combined loss for disease classification + severity regression."""

    def __init__(self, disease_weight=1.0, severity_weight=0.3):
        super().__init__()
        self.disease_weight = disease_weight
        self.severity_weight = severity_weight
        self.ce_loss = nn.CrossEntropyLoss()
        self.mse_loss = nn.MSELoss()

    def forward(
        self,
        disease_logits: torch.Tensor,
        disease_labels: torch.Tensor,
        severity_pred: torch.Tensor,
        severity_labels: torch.Tensor,
    ) -> Dict[str, torch.Tensor]:
        disease_loss = self.ce_loss(disease_logits, disease_labels)
        severity_loss = self.mse_loss(severity_pred, severity_labels)
        total = self.disease_weight * disease_loss + self.severity_weight * severity_loss
        return {
            "total": total,
            "disease": disease_loss,
            "severity": severity_loss
        }


# ── Training Functions ─────────────────────────────────────────────────────────
def freeze_backbone(model: AgroSentinelVisionModel):
    """Freeze all backbone parameters."""
    for param in model.backbone.parameters():
        param.requires_grad = False
    logger.info("Backbone frozen.")


def unfreeze_last_blocks(model: AgroSentinelVisionModel, num_blocks: int = 3):
    """Unfreeze the last N blocks of EfficientNet backbone."""
    blocks = list(model.backbone.children())
    for block in blocks[-num_blocks:]:
        for param in block.parameters():
            param.requires_grad = True
    logger.info(f"Last {num_blocks} backbone blocks unfrozen for fine-tuning.")


def train_epoch(
    model: AgroSentinelVisionModel,
    loader: DataLoader,
    optimizer: optim.Optimizer,
    criterion: MultiTaskLoss,
    device: str,
) -> Dict[str, float]:
    """Run one training epoch. Returns loss and accuracy metrics."""
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (images, labels, severities) in enumerate(loader):
        images = images.to(device)
        labels = labels.to(device)
        severities = severities.to(device)

        optimizer.zero_grad()
        outputs = model(images)

        loss_dict = criterion(
            outputs["disease_logits"], labels,
            outputs["severity"], severities,
        )
        loss_dict["total"].backward()
        
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        total_loss += loss_dict["total"].item()
        preds = outputs["disease_logits"].argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += len(labels)

        if batch_idx % 20 == 0:
            logger.info(f"  Batch {batch_idx}/{len(loader)} | Loss: {loss_dict['total'].item():.4f}")

    return {
        "loss": total_loss / len(loader),
        "accuracy": correct / total,
    }


@torch.no_grad()
def evaluate(
    model: AgroSentinelVisionModel,
    loader: DataLoader,
    criterion: MultiTaskLoss,
    device: str,
) -> Dict[str, float]:
    """Evaluate model on validation set."""
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    for images, labels, severities in loader:
        images = images.to(device)
        labels = labels.to(device)
        severities = severities.to(device)

        outputs = model(images)
        loss_dict = criterion(
            outputs["disease_logits"], labels,
            outputs["severity"], severities,
        )

        total_loss += loss_dict["total"].item()
        preds = outputs["disease_logits"].argmax(dim=1)
        correct += (preds == labels).sum().item()
        total += len(labels)

        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    return {
        "loss": total_loss / len(loader),
        "accuracy": correct / total,
    }


# ── Main Training Loop ─────────────────────────────────────────────────────────
def main():
    logger.info("=" * 60)
    logger.info("AgroSentinel AI — Vision Model Training")
    logger.info("=" * 60)
    logger.info(f"Device: {DEVICE}")
    logger.info(f"Disease classes: {NUM_CLASSES}")

    # ── Dataset Selection ──────────────────────────────────────────────────────
    plantvillage_path = project_root / "data" / "raw" / "plantvillage"
    
    if plantvillage_path.exists() and any(plantvillage_path.iterdir()):
        logger.info(f"📁 Using PlantVillage dataset from {plantvillage_path}")
        train_dataset = PlantVillageDataset(
            str(plantvillage_path), 
            transform=get_train_transform(IMAGE_SIZE)
        )
        val_size = int(0.15 * len(train_dataset))
        train_size = len(train_dataset) - val_size
        train_dataset, val_dataset = random_split(
            train_dataset, [train_size, val_size],
            generator=torch.Generator().manual_seed(42)
        )
        val_dataset.dataset.transform = get_val_transform(IMAGE_SIZE)
        dataset_type = "PlantVillage"
    else:
        logger.warning("PlantVillage not found. Using SYNTHETIC dataset for pipeline testing.")
        logger.warning(f"Download PlantVillage to: {plantvillage_path}")
        train_dataset = SyntheticCropDataset(
            num_samples=1600,
            transform=get_train_transform(IMAGE_SIZE),
            split="train"
        )
        val_dataset = SyntheticCropDataset(
            num_samples=400,
            transform=get_val_transform(IMAGE_SIZE),
            split="val",
            seed=99
        )
        dataset_type = "Synthetic (Pipeline Test)"

    train_loader = DataLoader(
        train_dataset, batch_size=BATCH_SIZE, shuffle=True,
        num_workers=0, pin_memory=(DEVICE == "cuda")
    )
    val_loader = DataLoader(
        val_dataset, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=0, pin_memory=(DEVICE == "cuda")
    )

    logger.info(f"Dataset: {dataset_type}")
    logger.info(f"Train samples: {len(train_dataset)}, Val samples: {len(val_dataset)}")

    # ── Model ──────────────────────────────────────────────────────────────────
    model = AgroSentinelVisionModel(num_classes=NUM_CLASSES).to(DEVICE)
    criterion = MultiTaskLoss()

    # ── Stage 1: Head Training (frozen backbone) ───────────────────────────────
    logger.info("\n" + "=" * 40)
    logger.info("STAGE 1: Training classification head (backbone frozen)")
    logger.info("=" * 40)

    freeze_backbone(model)
    
    # Only optimize unfrozen parameters
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=1e-3,
        weight_decay=1e-4
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=STAGE1_EPOCHS)

    best_val_acc = 0.0
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}

    for epoch in range(1, STAGE1_EPOCHS + 1):
        t0 = time.time()
        train_metrics = train_epoch(model, train_loader, optimizer, criterion, DEVICE)
        val_metrics = evaluate(model, val_loader, criterion, DEVICE)
        scheduler.step()

        history["train_loss"].append(train_metrics["loss"])
        history["val_loss"].append(val_metrics["loss"])
        history["train_acc"].append(train_metrics["accuracy"])
        history["val_acc"].append(val_metrics["accuracy"])

        elapsed = time.time() - t0
        logger.info(
            f"[S1 Epoch {epoch:2d}/{STAGE1_EPOCHS}] "
            f"Train Loss: {train_metrics['loss']:.4f} Acc: {train_metrics['accuracy']:.4f} | "
            f"Val Loss: {val_metrics['loss']:.4f} Acc: {val_metrics['accuracy']:.4f} | "
            f"Time: {elapsed:.1f}s"
        )

        if val_metrics["accuracy"] > best_val_acc:
            best_val_acc = val_metrics["accuracy"]
            torch.save({
                "model_state_dict": model.state_dict(),
                "epoch": epoch,
                "val_accuracy": best_val_acc,
                "version": "vision_v0.1",
                "disease_classes": DISEASE_CLASSES,
                "dataset_type": dataset_type,
            }, CHECKPOINT_PATH)
            logger.info(f"  ✅ Best model saved (val_acc: {best_val_acc:.4f})")

    # ── Stage 2: Fine-tuning (unfreeze last blocks) ────────────────────────────
    logger.info("\n" + "=" * 40)
    logger.info("STAGE 2: Fine-tuning (last 3 backbone blocks unfrozen)")
    logger.info("=" * 40)

    unfreeze_last_blocks(model, num_blocks=3)
    
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=1e-4,  # Lower LR for fine-tuning
        weight_decay=1e-4
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=STAGE2_EPOCHS)

    for epoch in range(1, STAGE2_EPOCHS + 1):
        t0 = time.time()
        train_metrics = train_epoch(model, train_loader, optimizer, criterion, DEVICE)
        val_metrics = evaluate(model, val_loader, criterion, DEVICE)
        scheduler.step()

        history["train_loss"].append(train_metrics["loss"])
        history["val_loss"].append(val_metrics["loss"])
        history["train_acc"].append(train_metrics["accuracy"])
        history["val_acc"].append(val_metrics["accuracy"])

        elapsed = time.time() - t0
        logger.info(
            f"[S2 Epoch {epoch:2d}/{STAGE2_EPOCHS}] "
            f"Train Loss: {train_metrics['loss']:.4f} Acc: {train_metrics['accuracy']:.4f} | "
            f"Val Loss: {val_metrics['loss']:.4f} Acc: {val_metrics['accuracy']:.4f} | "
            f"Time: {elapsed:.1f}s"
        )

        if val_metrics["accuracy"] > best_val_acc:
            best_val_acc = val_metrics["accuracy"]
            torch.save({
                "model_state_dict": model.state_dict(),
                "epoch": STAGE1_EPOCHS + epoch,
                "val_accuracy": best_val_acc,
                "version": "vision_v0.1",
                "disease_classes": DISEASE_CLASSES,
                "dataset_type": dataset_type,
            }, CHECKPOINT_PATH)
            logger.info(f"  ✅ Best model saved (val_acc: {best_val_acc:.4f})")

    # ── Save Final Results ─────────────────────────────────────────────────────
    results = {
        "experiment": "vision_training",
        "model_version": "vision_v0.1",
        "dataset_type": dataset_type,
        "device": DEVICE,
        "best_val_accuracy": round(best_val_acc, 4),
        "stage1_epochs": STAGE1_EPOCHS,
        "stage2_epochs": STAGE2_EPOCHS,
        "final_train_loss": round(history["train_loss"][-1], 4),
        "final_val_loss": round(history["val_loss"][-1], 4),
        "note": (
            "PIPELINE TEST WITH SYNTHETIC DATA - not a real disease detector"
            if dataset_type == "Synthetic (Pipeline Test)"
            else "Trained on PlantVillage dataset"
        ),
    }

    results_path = CHECKPOINT_DIR / "vision_training_results.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    logger.info("\n" + "=" * 60)
    logger.info("✅ Vision Model Training Complete!")
    logger.info(f"   Best Val Accuracy: {best_val_acc:.4f}")
    logger.info(f"   Checkpoint: {CHECKPOINT_PATH}")
    logger.info(f"   Results: {results_path}")
    if dataset_type == "Synthetic (Pipeline Test)":
        logger.warning("   ⚠️  Trained on SYNTHETIC data. Download PlantVillage for real performance.")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
