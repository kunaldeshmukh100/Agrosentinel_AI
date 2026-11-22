# Setup Guide

This guide will help you set up AgroSentinel AI on your local Windows/Linux environment.

## Prerequisites
- Python 3.11+
- Node.js 22+
- PyTorch 2.5.1+ (CUDA recommended if available)
- Git

## Step 1: Clone Repository
```bash
git clone https://github.com/your-username/agrosentinel-ai.git
cd agrosentinel-ai
```

## Step 2: Install Python Dependencies
Create a virtual environment and install requirements:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
# source venv/bin/activate

pip install -r requirements.txt
```

## Step 3: Generate Synthetic Data
Since real multimodal datasets are proprietary/hard to find, we generate our own structured data to pair with images.
```bash
python scripts/generate_synthetic_data.py
```
*This will create the necessary CSVs and sqlite databases in the `data/` folder.*

## Step 4: Train Vision Model (Optional but recommended)
If you want to train the model from scratch:
```bash
python ml_pipeline/train.py --epochs 10 --batch_size 32
```
*Note: A pre-trained model `model_best.pth` should already be in the `models/` directory for immediate use.*

## Step 5: Start Backend
Start the FastAPI server:
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```
The API documentation will be available at `http://localhost:8000/docs`.

## Step 6: Start Frontend
Open a new terminal, navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```

## Step 7: Open Browser
Navigate to `http://localhost:3000` in your web browser to view the application.

## Demo Credentials
To log in to the Officer Dashboard, use the following:
- **Email**: `officer@agrosentinel.in`
- **Password**: `demo123`

## Troubleshooting Common Errors
- **CUDA Out of Memory**: Reduce the batch size in `train.py` or run inference on CPU by setting `DEVICE='cpu'` in `.env`.
- **ModuleNotFoundError: No module named 'fastapi'**: Ensure your virtual environment is activated before running uvicorn.
- **Node Sass / React errors**: Delete `node_modules` and `package-lock.json`, verify you are on Node 22, and run `npm install` again.
