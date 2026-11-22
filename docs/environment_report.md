# AgroSentinel AI — Environment Report

Generated: 2026-08-15

## Hardware

| Component       | Details                           |
|----------------|-----------------------------------|
| OS             | Windows 11 Home Single Language   |
| CPU            | Intel (1 Processor)               |
| RAM            | 16 GB                             |
| GPU            | NVIDIA GeForce RTX 3050 Laptop    |
| GPU VRAM       | 6 GB                              |
| NVIDIA Driver  | 581.86                            |
| CUDA Version   | 13.0                              |

## Software Versions

| Tool        | Version              | Status  |
|------------|----------------------|---------|
| Python     | 3.11.9               | ✅ OK   |
| pip        | 26.2                 | ✅ OK   |
| Node.js    | v22.19.0             | ✅ OK   |
| npm        | 10.9.3               | ✅ OK   |
| Git        | 2.53.0.windows.1     | ✅ OK   |
| Docker     | Not installed        | ⚠️ Skipped |
| PyTorch    | 2.5.1+cu121          | ✅ OK   |
| CUDA avail | True                 | ✅ GPU Enabled |

## Engineering Decisions Based on Environment

1. **GPU Training**: RTX 3050 with 6GB VRAM is available. We will use:
   - EfficientNet-B0 (smaller footprint, fits in 6GB)
   - Mixed precision (FP16) to maximise VRAM efficiency
   - Batch sizes limited to 16-32 for the vision model

2. **Docker**: Docker is not installed. We will:
   - Build all services to run locally without Docker
   - Provide Dockerfiles and docker-compose.yml for future use
   - Document how to install Docker if needed

3. **Database**: PostgreSQL + PostGIS will be set up locally.
   - If PostgreSQL is not installed, we fall back to SQLite + SpatiaLite for the demo

4. **Storage**: Local filesystem storage (development mode).
   - S3/MinIO abstraction will be provided but not required.

5. **Training**: Full CUDA training with EfficientNet-B0 backbone.
   - Transfer learning with ImageNet pretrained weights.

## Resource Estimation

| Task                    | Estimated RAM | Estimated VRAM |
|------------------------|--------------|----------------|
| Frontend (Next.js)     | ~300 MB      | —              |
| Backend (FastAPI)      | ~400 MB      | —              |
| Vision Model Inference | ~500 MB      | ~1 GB          |
| Vision Model Training  | ~1 GB        | ~3-4 GB        |
| Multimodal Inference   | ~800 MB      | ~1.5 GB        |
| PostgreSQL             | ~200 MB      | —              |
| Total (all running)    | ~3.5 GB      | ~2 GB          |

All components should run comfortably on this hardware.
