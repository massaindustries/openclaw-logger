# Ralph Task - Iteration 2/20

## Task

(Insert task description here)

## Environment
This project runs on Docker. The docker-compose.dev.yml file is located in the parent `dev` folder.

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

## Docker Best Practices (MUST FOLLOW)

### CRITICAL RULES
1. **NEVER prune Docker** - Do not run `docker system prune`, `docker image prune`, `docker volume prune`, or any prune commands. All Docker objects must be preserved for reproducibility and debugging.
2. **Always use multi-stage builds** for production images to minimize final image size
3. **Use specific version tags** - Never use `latest` tag, always specify exact versions (e.g., `python:3.12-slim`, `node:20-alpine`)
4. **Minimize layers** - Combine RUN commands where appropriate
5. **Use .dockerignore** - Exclude unnecessary files (node_modules, .git, __pycache__, venv)

### Image Building Best Practices
- Use `--no-cache-dir` for pip installations
- Use `npm ci` instead of `npm install` for reproducible builds
- Clean up package manager caches after installations
- Use slim or alpine base images when possible
- Set proper WORKDIR before COPY commands

### Security Best Practices
- Never hardcode secrets in Dockerfiles
- Use environment variables for sensitive configuration
- Run containers as non-root user when possible
- Scan images for vulnerabilities before publishing

## Instructions
1. Analyze the task and understand what needs to be done
2. Make the necessary code changes
3. Test your changes by running the relevant services
4. After each significant change, commit to git with a descriptive message prefixed with `RALPH-`
   - Example: `git add . && git commit -m "RALPH-add-user-authentication-endpoint"`
5. When all changes are complete and verified, output: <promise>All tasks for this iteration are completed.</promise>

## Current Tasks (if applicable)

(Insert any sub‑tasks here)

## Additional Context

(Insert any additional context or references here)
