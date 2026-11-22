import sys
from pathlib import Path

# Add project root to sys.path to find ml/ modules
project_root = Path(__file__).parent.parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))
