from fastapi import APIRouter

router = APIRouter()

@router.get('/health')
def health_check():
    """Check API health status."""
    return {'status': 'healthy', 'service': 'AgroSentinel AI', 'version': '0.1.0'}
