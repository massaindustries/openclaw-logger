# Ralph Task - Iteration 5/20

## Task

- Ensure the project's test suite runs without errors.
- Fix any pytest configuration problems (e.g., non‑top‑level conftest files).
- Add a top‑level `conftest.py` if needed to set up the test environment.
- Verify all tests pass successfully.

## Environment
This project runs on Docker. The `docker-compose.dev.yml` file is located in the parent `dev` folder.

### Docker Commands
- **Start services:** `docker compose -f ../dev/docker-compose.dev.yml up -d`
- **View logs:** `docker compose -f ../dev/docker-compose.dev.yml logs -f [service]`
- **Restart a service:** `docker compose -f ../dev/docker-compose.dev.yml restart [service]`
- **Stop services:** `docker compose -f ../dev/docker-compose.dev.yml down`

### Available Services
- **frontend** - Node.js app on port 3000
- **api** - Python FastAPI on port 8000
- **worker** - Celery worker
- **postgres** - PostgreSQL on port 5432
- **redis** - Redis on port 6379
- **neo4j** - Neo4j on port 7474/7687
- **qdrant** - Qdrant vector DB on port 6333
- **nginx** - Nginx proxy on port 80

## Instructions
1. Analyze the repository for pytest configuration issues.
2. Apply the necessary fixes (e.g., move `pytest_plugins` to a top‑level `conftest.py`).
3. Run the test suite and ensure all tests pass.
4. Document any remaining issues.
5. When verification is complete, output: <promise>All tasks for this iteration are completed.</promise>

## Current Tasks (if applicable)
- Verify pytest collection works
- Add/adjust top‑level `conftest.py`
- Run `pytest` and confirm passing tests

## Additional Context
- The previous iteration verified Docker Compose orchestration.
- This iteration focuses on the Python test environment.
