# Log Viewer Backend

FastAPI backend for the Log Viewer Dashboard.

## Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

## Run

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
