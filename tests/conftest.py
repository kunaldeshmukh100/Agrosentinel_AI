import pytest
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'apps' / 'api'))

@pytest.fixture(scope='session')
def api_base_url():
    return 'http://localhost:8000'
