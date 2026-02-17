# OpenClaw Logger 🦞🪵

**Session Tracker & Analytics Dashboard**

A modern web dashboard to track, monitor, and analyze your OpenClaw AI agent sessions in real time. Full transparency. Fully local. No black boxes.



https://github.com/user-attachments/assets/b31a65da-747f-4f18-bae1-caaa64f1641d



## Why OpenClaw Logger?

OpenClaw agents are powerful but opaque.
When running critical tasks, you shouldn’t have to wait for the final report to understand what happened.


*All the Automation Industry in the world relies on one single principle : correcting the system's actions with costant feedback by the obtained output, so we implemented this key point in Openclaw.*

OpenClaw Logger gives you:

* **Real-time transparency** : See every message and tool call
* **Local-only processing** : Nothing leaves your machine
* **Behavior analytics** : Understand patterns and loops
* **AI-assisted debugging** : Ask contextual questions about selected logs


---


<img width="1920" height="1080" alt="Openclaw (1)" src="https://github.com/user-attachments/assets/b336407e-5b71-424d-806f-5c52db08be11" />


---

<br>
<br>
<br>

# Quick Start (Local Development)

This runs **backend + frontend** without Docker.


## 1️⃣ Start the Backend (FastAPI)

```bash
cd backend

python -m venv venv
source venv/bin/activate      # Linux / Mac
# or
.\venv\Scripts\activate       # Windows

pip install -r requirements.txt

uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Backend will run at:

```
http://localhost:8000
```

Keep this terminal open.

<br>
<br>


## 2️⃣ Start the Frontend (Next.js)

Open a new terminal:

```bash
cd next

npm install
npm run dev
```

Frontend will run at:

```
http://localhost:3000
```

Open it in your browser.


<br>
<br>


## 3️⃣ Configure Your OpenClaw Sessions Path

1. Locate your OpenClaw sessions folder:

```
.openclaw/agents/(name of the agent)/sessions
```

2. In the dashboard:

   * Go to **Sessions**
   * Enter the full path to that folder
   * Click **Save**

The Logger will now auto-poll every 5 seconds and parse sessions live.

<br>
<br>

# Quick Start (Docker)

If you prefer full containerization:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Frontend:

```
http://localhost:3000
```

Backend:

```
http://localhost:8000
```

To stop:

```bash
docker compose down
```
<br>
<br>


# Architecture

```
openclaw-logger/
├── next/        # Frontend (Next.js 16 + Tailwind + Zustand)
├── backend/     # FastAPI + SSE + LLM providers
└── docker/
```
<br>
<br>

# AI Configuration

Insert your API keys inside the chat settings panel to use your chat as knowledge and actively debug with an AI-Chatbot.

Supported providers:

* Regolo.ai (racommended)
* OpenAI
* Anthropic
* Google
* Grok

<br>


## Why [Regolo.ai](https://regolo.ai)? 🇪🇺

We selected [Regolo.ai](https://regolo.ai) as our primary provider for two critical engineering constraints: zero-retention guarantees and low-latency inference.

For privacy-first deployments, Regolo.ai represents a structurally stronger option:

- 100% EU-based infrastructure (Italy)
- Zero data retention by design
- Full GDPR compliance
- Renewable-energy powered data centers

If your architecture must satisfy strict European sovereignty, regulatory compliance, and data minimization principles, this choice is not ideological — it is technical risk management.

In systems engineering, constraints define quality. Here, jurisdiction is a constraint.



# Security Model

* Session files are read locally
* No telemetry
* No automatic external transmission
* API calls only occur when you explicitly chat with an LLM

This tool exists to remove opacity—not introduce new attack surfaces.



<br>
<br>


## Tech Stack

OpenClaw Logger is intentionally minimal, deterministic, and locally executable. The architecture separates visualization, parsing, and inference routing.

### Frontend

* **Next.js 16**
* **React 19**
* **Tailwind CSS**
* **shadcn/ui**

### Backend

* **FastAPI**
* **Python 3.12+**
* **Uvicorn**
* **Async I/O**
* **LLM Provider Adapters**
* **SSE Streaming Layer**

### AI Providers

* Regolo.ai
* OpenAI
* Anthropic
* Google
* xAI

### Deployment Options

* Local development (Node + Python)
* Docker Compose
<br>

The stack is deliberately simple: no database, no telemetry, no external logging layer.
Filesystem in, structured visualization out.






