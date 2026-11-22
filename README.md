# 🌾 AgroSentinel AI

> **Multimodal AI-Based Crop Disease Outbreak Early-Warning and Forecasting System**

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-red)](https://pytorch.org)
[![Tests](https://img.shields.io/badge/Unit_Tests-55%2F55_passing-brightgreen)](#testing)

---

## 🎯 What is AgroSentinel AI?

AgroSentinel AI goes **beyond single-image disease classification**. It fuses six distinct data modalities through a Gated Cross-Attention Transformer to predict not just *what disease is present*, but *how likely it is to become a regional outbreak*, and *how far it will spread in 3, 5, and 7 days*.

### The Core Innovation

| Feature | Traditional Approaches | AgroSentinel AI |
|---|---|---|
| Input | Single crop photo | Image + Weather + Satellite + Geo + Crop stage + History |
| Output | "This is late blight" | Risk forecast, cluster detection, 7-day spread prediction |
| Scope | Single farm | Regional outbreak intelligence |
| Users | Farmer only | Farmer + District Agricultural Officer |
| Action | Treatment | **Early intervention before cluster forms** |

---

## 🏗️ Architecture Overview

```
                    FARMER SUBMITS OBSERVATION
                           │
               ┌───────────┼───────────┐
               ▼           ▼           ▼
         [Crop Image]  [Location]  [Crop Info]
               │           │           │
               ▼           │           ▼
     EfficientNet-B0    DBSCAN     CropFeatureEngineer
      Vision Model    Clustering    (stage, days)
               │           │           │
               ▼           ▼           ▼
         [128-dim     [Geo Features]  [Crop Feats]
          embedding]       │              │
               │     ┌─────┴──────┐      │
               │     │ Weather    │      │
               │     │ XGBoost    │      │
               │     └─────┬──────┘      │
               │           │             │
               │     [Satellite Feats]   │
               │     [Historical Feats]  │
               │           │             │
               └─────────┬─┴─────────────┘
                         ▼
              ┌─────────────────────────┐
              │   GATED CROSS-ATTENTION  │
              │   TRANSFORMER FUSION     │
              │   (6 modalities × 128d) │
              └──────────┬──────────────┘
                         ▼
              ┌──────────┴─────────────┐
              │   MULTI-TASK HEADS     │
              ├────────────────────────┤
              │ ✓ Disease class (15)   │
              │ ✓ Severity score       │
              │ ✓ Current risk (0-1)   │
              │ ✓ Risk 3d/5d/7d        │
              │ ✓ Spread probability   │
              │ ✓ Modality gates       │
              └────────────────────────┘
                         │
              ┌──────────┴─────────────┐
              │  ALERT LEVEL ENGINE    │
              │ GREEN / YELLOW /       │
              │ ORANGE / RED           │
              └────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| CUDA (optional) | Any |

### 1. Clone & Setup

```bash
git clone <repo>
cd agrosentinel-ai
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Generate Synthetic Demo Data

```bash
python scripts/generate_synthetic_data.py
```

### 4. Start Backend API

```bash
cd apps/api
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 5. Start Frontend

```bash
cd apps/web
npm install
npm run dev
```

### 6. Open in Browser

- **Frontend:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Health:** http://localhost:8000/api/v1/health

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🌾 Farmer | farmer@demo.agrosentinel.ai | farmer123 |
| 👮 Officer | officer@demo.agrosentinel.ai | officer123 |

---

## 📁 Project Structure

```
agrosentinel-ai/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── main.py             # Application entry point
│   │   ├── database/           # SQLAlchemy ORM models
│   │   ├── api/routes/         # All API endpoints
│   │   ├── core/               # Auth, config, security
│   │   └── schemas/            # Pydantic request/response schemas
│   └── web/                    # Next.js 16 frontend
│       ├── app/                # Pages (App Router)
│       ├── components/         # Reusable UI components
│       └── lib/                # API client, types
├── ml/
│   ├── vision/                 # EfficientNet-B0 vision model
│   ├── weather/                # XGBoost weather risk model
│   ├── geospatial/             # DBSCAN spatial clustering
│   └── fusion/                 # Gated Cross-Attention Transformer
├── data/
│   ├── synthetic/              # Generated demo data (Nashik scenario)
│   └── uploads/                # Farmer-submitted images
├── models/
│   └── checkpoints/            # Trained model weights
├── scripts/
│   ├── generate_synthetic_data.py
│   └── train_vision_model.py
├── tests/
│   ├── unit/                   # 55 unit tests (all passing)
│   └── api/                    # Integration tests (live API)
└── docs/                       # Comprehensive documentation
```

---

## 🧠 ML Pipeline Details

### Vision Model (EfficientNet-B0)
- Input: 224×224 crop images
- Output: 128-dim embedding + disease classification (15 classes) + severity
- Training: 2-stage (frozen backbone → fine-tune last 3 blocks)
- **Pipeline test accuracy: 87.75%** on synthetic data (see ⚠️ below)

### Weather Feature Engineering (14 features)
- 3-day, 7-day, 14-day rolling humidity/temperature/rainfall means
- Consecutive wet days, disease-favorable day count
- Temperature anomaly, vapor pressure deficit

### Multimodal Fusion (Gated Cross-Attention Transformer)
- 6 modalities → 128-dim projection each
- 2-layer Transformer encoder (4 attention heads)
- Learned gating weights per modality
- 7 prediction heads (multi-task learning)

### Geospatial Engine (DBSCAN)
- Haversine metric, eps=5km, min_samples=3
- Computes nearby case density, cluster membership, growth rate

---

## 📊 Disease Classes Supported

| # | Disease | Crop |
|---|---|---|
| 1 | Healthy | All |
| 2 | Late Blight | Tomato |
| 3 | Early Blight | Tomato |
| 4 | Bacterial Spot | Tomato |
| 5 | Septoria Leaf Spot | Tomato |
| 6 | Leaf Mold | Tomato |
| 7 | Spider Mites | Tomato |
| 8 | Target Spot | Tomato |
| 9 | Mosaic Virus | Tomato |
| 10 | Yellow Leaf Curl Virus | Tomato |
| 11 | Powdery Mildew | Wheat |
| 12 | Downy Mildew | Multiple |
| 13 | Rust | Wheat |
| 14 | Anthracnose | Multiple |
| 15 | Fusarium Wilt | Multiple |

---

## 🧪 Testing

```bash
# Unit tests (55 tests, all passing)
python -m pytest tests/unit/ -v

# Integration tests (requires running server)
python -m pytest tests/api/ -v

# Run all
python -m pytest tests/ -v
```

---

## ⚠️ Important Limitations

1. **Vision model trained on SYNTHETIC data** — not a real disease detector until trained on PlantVillage dataset
2. **Fusion model uses heuristic weights** — full training requires ~2000+ real observations
3. **Satellite features are simulated** — real deployment needs NASA EarthData or Sentinel-2 API
4. **No SMS/notification integration** — alert system logs to database only
5. **Docker not configured** for this environment

See [docs/limitations.md](docs/limitations.md) for full details.

---

## 📚 Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | Full system architecture |
| [ML Pipeline](docs/ml_architecture.md) | ML models explained |
| [Multimodal Fusion](docs/multimodal_fusion.md) | Beginner-friendly fusion explanation |
| [Geospatial Engine](docs/geospatial.md) | DBSCAN clustering details |
| [Data Card](docs/data_card.md) | Dataset documentation |
| [Model Card](docs/model_card.md) | ML model card |
| [Setup Guide](docs/setup.md) | Detailed setup instructions |
| [Demo Guide](docs/demo.md) | How to run the demo |
| [SIH Pitch](docs/sih_pitch.md) | Presentation document |
| [Roadmap](docs/roadmap.md) | Future development |
| [Limitations](docs/limitations.md) | Honest limitations |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/v1/health` | Detailed health |
| POST | `/api/v1/auth/login` | Login → JWT token |
| POST | `/api/v1/auth/register` | Register new user |
| GET | `/api/v1/auth/me` | Current user info |
| GET | `/api/v1/farms/` | List farms |
| POST | `/api/v1/farms/` | Create farm |
| POST | `/api/v1/predict/` | **Full multimodal prediction** |
| GET | `/api/v1/dashboard/` | Officer dashboard data |
| POST | `/api/v1/demo/step` | Advance demo simulation |
| POST | `/api/v1/demo/what-if` | What-if risk analysis |
| GET | `/api/v1/demo/scenario` | Demo scenario metadata |
| GET | `/docs` | Swagger UI |

---

## 👥 Team

Built as a prototype for the Smart India Hackathon (SIH).

---

> ⚠️ **DEMO SYSTEM** — This is a prototype for demonstration purposes.  
> All synthetic data is clearly labeled. Vision model trained on synthetic pipeline data only.  
> See [docs/limitations.md](docs/limitations.md) for full transparency.
