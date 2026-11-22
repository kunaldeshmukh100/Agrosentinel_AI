import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'apps' / 'api'))

import torch
from ml.vision.vision_model import AgroSentinelVisionModel, NUM_CLASSES

def test_model_output_shape():
    model = AgroSentinelVisionModel()
    model.eval()
    
    # Batch size 2, 3 channels, 224x224
    img_tensor = torch.randn(2, 3, 224, 224)
    with torch.no_grad():
        output = model(img_tensor)
        
    assert 'disease_logits' in output
    assert 'severity' in output
    assert 'embedding' in output
    
    assert output['disease_logits'].shape == (2, NUM_CLASSES)
    assert output['severity'].shape == (2, 1)
    assert output['embedding'].shape == (2, 128)

def test_disease_logits_shape():
    model = AgroSentinelVisionModel()
    model.eval()
    img_tensor = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        output = model(img_tensor)
    assert output['disease_logits'].shape == (1, NUM_CLASSES)

def test_severity_range():
    model = AgroSentinelVisionModel()
    model.eval()
    img_tensor = torch.randn(10, 3, 224, 224)
    with torch.no_grad():
        output = model(img_tensor)
    
    severity = output['severity']
    assert torch.all(severity >= 0.0)
    assert torch.all(severity <= 1.0)

def test_embedding_dim():
    model = AgroSentinelVisionModel()
    model.eval()
    img_tensor = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        output = model(img_tensor)
    assert output['embedding'].shape[1] == 128

def test_missing_image_fallback():
    # If embedding is zero, the model should handle it
    model = AgroSentinelVisionModel()
    model.eval()
    
    # Simulate missing image with zero tensor
    img_tensor = torch.zeros(1, 3, 224, 224)
    with torch.no_grad():
        output = model(img_tensor)
        
    assert output['embedding'].shape == (1, 128)
