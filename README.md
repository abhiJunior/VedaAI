# 🎓 VedaAI – AI Assessment Creator

> A production-grade full-stack app that lets teachers generate AI-powered question papers in seconds.

![VedaAI](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Gemini-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## ✨ Features

- 📝 **Create Assignments** — Set subject, grade, question types, marks, and difficulty distribution
- 🤖 **AI Question Generation** — Gemini 1.5 Flash generates structured question papers with sections
- ⚡ **Real-time Progress** — WebSocket (Socket.io) pushes live progress: started → generating → complete
- 📊 **Structured Output** — JSON-validated paper with numbered questions, difficulty badges, MCQ options, and answer spaces
- 🔁 **Regenerate** — Re-queue any assignment for a fresh AI generation
- 📄 **PDF Download** — Download as PDF (pdfkit-powered)
- 🏗️ **Queue-based** — BullMQ + Redis ensures jobs are resilient, retried on failure (3 attempts)

---

## 🏗️ Architecture

```
VedaAI/
├── backend/                  # Node.js + Express (ES Modules)
│   └── src/
│       ├── config/           # db.js, redis.js, socket.js
│       ├── models/           # Assignment.js (Mongoose)
│       ├── routes/           # assignments.js
│       ├── controllers/      # assignmentController.js
│       ├── queues/           # questionQueue.js (BullMQ)
│       ├── workers/          # questionWorker.js (AI processing)
│       ├── services/         # aiService.js (prompt + Gemini + parser)
│       └── app.js
│
└── frontend/                 # React + Vite + Tailwind CSS v4
    └── src/
        ├── api/              # axios client
        ├── app/              # Redux store
        ├── features/         # assignmentsSlice.js
        ├── hooks/            # useSocket.js
        ├── components/       # Sidebar, Layout, DifficultyBadge, GenerationProgress
        └── pages/            # AssignmentsPage, CreateAssignmentPage, OutputPage
```

**System Flow:**

```
Teacher fills form → POST /api/assignments
  → Assignment saved to MongoDB (status: pending)
  → BullMQ job enqueued
  → Worker picks job:
      → prompt built → Gemini API called → JSON parsed
      → MongoDB updated (status: completed, result: {...})
      → Socket.io emits job-completed to browser room
  → Frontend receives event → navigates to OutputPage
```

---

## 🚀 Quick Start

### Prerequisites

| Service | Where to get |
|---------|-------------|
| Node.js ≥ 18 | [nodejs.org](https://nodejs.org) |
| MongoDB | [Atlas free tier](https://www.mongodb.com/atlas) or local |
| Redis | [Upstash free tier](https://upstash.com) or local |
| Gemini API Key | [aistudio.google.com](https://aistudio.google.com/app/apikey) — **Free** |

### 1. Clone & Install

```bash
git clone https://github.com/yourname/vedaai.git
cd VedaAI

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in your MONGODB_URI, REDIS_URL, and GEMINI_API_KEY
```

Required `.env` values:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vedaai
REDIS_URL=redis://default:pass@host.upstash.io:6379
GEMINI_API_KEY=your_key_here
CLIENT_URL=http://localhost:5173
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** 🎉

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assignments` | Create assignment + enqueue AI job |
| `GET` | `/api/assignments` | List all assignments |
| `GET` | `/api/assignments/:id` | Get single assignment with result |
| `POST` | `/api/assignments/:id/regenerate` | Re-queue for fresh generation |
| `GET` | `/api/assignments/:id/pdf` | Download PDF |
| `GET` | `/api/health` | Health check |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join-assignment` | Client → Server | `assignmentId` |
| `job-started` | Server → Client | `{ assignmentId, message, progress }` |
| `job-progress` | Server → Client | `{ assignmentId, message, progress }` |
| `job-completed` | Server → Client | `{ assignmentId, result }` |
| `job-failed` | Server → Client | `{ assignmentId, error }` |

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express (ES Modules, no TypeScript)
- MongoDB + Mongoose
- Redis + BullMQ (job queue with retry)
- Socket.io (real-time events)
- Google Gemini 1.5 Flash (free AI model)
- Multer (file uploads), pdfkit (PDF generation)

**Frontend**
- React 19 + Vite 8
- Tailwind CSS v4
- Redux Toolkit (state management)
- Socket.io-client (WebSocket)
- React Router v7
- react-hot-toast, lucide-react

---

## 🌐 Deployment

### Backend → [Render](https://render.com)
1. Create a **Web Service** pointing to `backend/`
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables from `.env`

### Frontend → [Vercel](https://vercel.com)
1. Import the `frontend/` folder
2. Framework: **Vite**
3. Set `VITE_API_URL` if needed (otherwise uses proxy in dev)

---

## 📄 License

MIT © 2026 VedaAI
