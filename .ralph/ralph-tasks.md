# Ralph Tasks - Dockerization

## Current Tasks

### 1. Backend Dockerization
- [ ] Create `docker/backend/Dockerfile`
  - Use Python 3.12-slim base image
  - Install dependencies from `backend/requirements.txt`
  - Set working directory to `/app`
  - Expose port 8000
  - Run uvicorn with host 0.0.0.0

### 2. Frontend Dockerization
- [ ] Create `docker/frontend/Dockerfile`
  - Use Node.js 20-alpine base image
  - Install dependencies from `next/package.json`
  - Build the Next.js app
  - Run with `npm start` (production mode)
  - Expose port 3000

### 3. Docker Compose Orchestration
- [ ] Create `docker/docker-compose.yml`
  - Define `backend` service
  - Define `frontend` service
  - Configure networking between services
  - Add volume for `.env` file mounting

### 4. Docker Ignore Files
- [ ] Create `.dockerignore` in project root
  - Exclude `node_modules/`
  - Exclude `venv/`
  - Exclude `.git/`
  - Exclude `__pycache__/`

### 5. GitHub Publishing Ready
- [ ] Add Docker Compose instructions to README.md
- [ ] Ensure .dockerignore is complete
- [ ] Test the full Docker workflow

## Testing Requirements
- [ ] Build backend image: `docker build -f docker/backend/Dockerfile -t openclaw-backend ./backend`
- [ ] Build frontend image: `docker build -f docker/frontend/Dockerfile -t openclaw-frontend ./next`
- [ ] Test compose: `docker compose -f docker/docker-compose.yml up -d`
- [ ] Verify backend responds at http://localhost:8000
- [ ] Verify frontend loads at http://localhost:3000

## Docker Best Practices (Must Follow)
1. **NEVER prune Docker** - Keep all images for reproducibility
2. Use slim/alpine base images to reduce size
3. Use `--no-cache-dir` for pip to reduce layer size
4. Use multi-stage builds for frontend
5. Always specify exact versions in base images
6. Use `.dockerignore` to exclude unnecessary files
