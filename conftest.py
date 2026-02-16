import sys
import os

# Ensure backend package is importable for tests
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

pytest_plugins = ["pytest_asyncio"]
