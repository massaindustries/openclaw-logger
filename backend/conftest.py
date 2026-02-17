import pytest
import asyncio

def pytest_pyfunc_call(pyfuncitem):
    """Run async test functions without requiring pytest-asyncio.
    
    If the test function is a coroutine, this hook will execute it using
    ``asyncio.run`` (or the current event loop) and report the result to
    pytest. This provides minimal support for ``async def`` test functions
    used in the test suite.
    """
    if asyncio.iscoroutinefunction(pyfuncitem.function):
        # Use asyncio.run which creates a new event loop for each call.
        # This is sufficient for the simple async tests in this project.
        asyncio.run(pyfuncitem.function())
        return True
    return None
