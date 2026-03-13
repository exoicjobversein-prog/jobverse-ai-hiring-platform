# JobVerse 🚀

**JobVerse** is a full-stack, AI-powered hiring ecosystem that automates the complete recruitment lifecycle — from intelligent resume screening and automated aptitude assessments to context-aware AI interviews and real-time proctoring. Built with **Django REST Framework**, **React + Vite**, and powered by the **Google Gemini AI API**.

---

## 🌟 Features Overview

| Feature | Description |
|---|---|
| 🎯 AI Resume Screening | Gemini AI scores & summarizes every resume against job requirements |
| 🧠 AI Interviews | Dynamic, context-aware technical interviews per candidate profile |
| 📝 Aptitude Tests | 80-question Full Readiness Test with fullscreen proctoring & anti-cheat |
| 🎙️ Practice Interviews | AI-driven mock interviews for student preparation |
| 📋 HR Job Management | Post, edit, delete jobs and manage all applicants |
| 📊 Analytics Dashboards | Score trends, domain breakdowns, and hiring insights |
| 💬 Community Chat | Real-time peer chat for students |
| 🔒 Anti-Cheat Proctoring | Tab-switch and fullscreen-exit detection with auto-submission |
| 📧 Email Automation | SMTP notifications for scheduling, acceptance, and results |
| 🏋️ Workshops | Student workshop discovery and enrollment |

---

## 🔄 Complete Application Flow

### 👤 Student Flow

```
Register/Login → Student Dashboard
   │
   ├── 📄 Resume Builder
   │      Upload or build resume → stored for all job applications
   │
   ├── 🔍 Job Marketplace
   │      Browse active job postings → Apply (attaches resume auto)
   │      └── Gemini AI scores resume vs job requirements (async, Celery)
   │
   ├── 📅 Interview Invitation
   │      HR schedules AI Interview → Student gets email notification
   │      Student Dashboard shows pulsing invitation panel
   │      Student Accepts or Rejects → HR notified via email
   │      Countdown timer shows until scheduled time
   │      At scheduled time → "Join AI Interview" button unlocks
   │
   ├── 🤖 AI Interview Session
   │      Full-screen interview UI
   │      AI generates questions from resume + job requirements (Gemini)
   │      Student answers in real time → each answer AI-evaluated
   │      On completion → Final Report (score, strengths, weaknesses, recommendation)
   │      HR notified via email
   │
   ├── 📝 Aptitude Practice
   │      Select category (APTITUDE, LOGICAL, COMMUNICATION, DOMAIN)
   │      or take 80-question Full Readiness Test (40 min)
   │      Fullscreen proctored — auto-submits on 3 total violations
   │      (Tab switch + fullscreen exit combined = 3 max)
   │      Results: score, domain breakdown, detailed answer review
   │
   ├── 🎙️ Practice Interview
   │      AI mock interview on any topic
   │      Async Gemini evaluation after each answer
   │
   ├── 💬 Community Chat
   │      Real-time peer discussion with other students
   │
   └── 🏋️ Workshops
          Browse & join skill workshops
```

### 🏢 HR Flow

```
Register/Login (role: HR) → HR Dashboard
   │
   ├── 📋 Post Job
   │      Title, company, requirements, skills, experience level, deadline
   │
   ├── 🗂️ View Jobs (My Jobs)
   │      See all self-posted jobs → Edit / Delete
   │      "View Applications" button per job
   │
   ├── 👥 Applications
   │      See all candidates who applied for a specific job
   │      AI Resume Match Score & Summary (from async screening)
   │      Download candidate resume as PDF
   │      Schedule AI Interview → candidate gets email invite
   │      Track candidate response (Accepted/Rejected/Pending)
   │      View completed interview report (score, strengths, weaknesses)
   │
   └── 📊 Analytics
          Hiring pipeline stats, score distributions, domain performance
```

---

## 🏗️ Architecture

### Backend — Django + DRF

```
backend/
├── core/                  # Django settings, URL root, ASGI/WSGI
├── apps/
│   ├── users/             # Custom user model (Student / HR roles), JWT auth
│   ├── jobs/              # Job postings, Applications, Resume AI screening
│   ├── resumes/           # Resume storage and AI summary generation
│   ├── interviews/        # AI Interviews, Practice Interviews, Aptitude Tests
│   ├── proctoring/        # Violation logs (tab switch, copy-paste, etc.)
│   └── workshops/         # Workshop model and enrollment
├── services/
│   └── ai_service.py      # All Gemini API calls (questions, evaluation, reports)
└── requirements.txt
```

| Layer | Technology |
|---|---|
| Framework | Django 4 + Django REST Framework |
| Auth | JWT (Simple JWT) |
| AI Engine | Google Gemini 1.5 Flash (via `google-generativeai`) |
| Task Queue | Celery + Redis |
| Database | PostgreSQL (Neon / local) |
| Email | SMTP (Gmail) |

### Frontend — React + Vite

```
frontend/src/
├── pages/
│   ├── Login.jsx / Register.jsx
│   ├── StudentDashboard.jsx        # Main layout for students
│   ├── HRDashboard.jsx             # Main layout for HR
│   ├── InterviewSession.jsx        # Live AI interview UI
│   ├── hr/
│   │   ├── Dashboard.jsx           # HR overview
│   │   ├── PostJob.jsx             # Job creation form
│   │   ├── MyJobs.jsx              # HR's job listings
│   │   ├── Applications.jsx        # Candidate management
│   │   ├── Analytics.jsx           # HR analytics charts
│   │   └── Profile.jsx
│   └── student/
│       ├── Dashboard.jsx           # Student overview + interview invite
│       ├── JobMarketplace.jsx      # Job search and apply
│       ├── AptitudePractice.jsx    # Proctored aptitude test
│       ├── PracticeInterview.jsx   # AI mock interview
│       ├── Resumes.jsx             # Resume builder
│       ├── CommunityChat.jsx       # Peer chat
│       ├── Workshops.jsx
│       ├── Analytics.jsx
│       └── Profile.jsx
├── services/
│   └── api.js                      # Axios instance with JWT interceptors
└── App.jsx                         # Route definitions
```

| Layer | Technology |
|---|---|
| Build Tool | Vite |
| UI Framework | React 18 + React Router DOM |
| Styling | Tailwind CSS + Lucide Icons |
| API Client | Axios |
| Notifications | React Hot Toast |

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis (for Celery task queue)
- PostgreSQL (or SQLite for quick dev)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/GautamSutar/JobVerse-AI.git
cd JobVerse-AI
```

---

### Step 2 — Environment Variables

Create a `.env` file inside `backend/` with the following:

```env
SECRET_KEY=your_django_secret_key
DEBUG=True

# Database (use SQLite for quick local dev, or Neon PostgreSQL)
DATABASE_URL=sqlite:///db.sqlite3

# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key

# Email (SMTP via Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com

# Redis (for Celery)
CELERY_BROKER_URL=redis://localhost:6379/0
```

---

### Step 3 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
.\venv\Scripts\python.exe manage.py migrate

# (Optional) Load sample aptitude questions
.\venv\Scripts\python.exe manage.py loaddata fixtures/aptitude_questions.json

# Start the Django development server
.\venv\Scripts\python.exe manage.py runserver
```

Backend runs at: **http://localhost:8000**

---

### Step 4 — Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### Step 5 — Celery Worker (Required for AI Tasks)

AI resume screening, interview question generation, and answer evaluation all run asynchronously via Celery. Start the worker in a separate terminal:

```bash
cd backend
.\venv\Scripts\activate
celery -A core worker -l info --pool=solo   # Windows
# celery -A core worker -l info             # Mac/Linux
```

> **Note:** Redis must be running before starting Celery. Install Redis locally or use a cloud Redis instance.

---

## 🔑 User Roles

| Role | Access |
|---|---|
| **Student** | Job marketplace, resume builder, aptitude tests, practice interviews, AI interview session, community chat, workshops |
| **HR** | Post/edit/delete jobs, view & manage applications, schedule AI interviews, view results and analytics |

Register with any email — select your role (Student / HR) during registration.

---

## 📝 Aptitude Test — Anti-Cheat Details

The Full Readiness Test and category-specific tests use fullscreen proctoring:

- **Fullscreen Enforced:** Test starts in mandatory fullscreen.
- **Unified Violation Pool:** Both fullscreen exits and tab switches share a combined limit of **3 total violations**.
- **Live Tracker:** A `Violations: X/3` counter is always visible top-right during the test.
- **Auto-Submission:** Exceeding 3 violations auto-submits the test immediately.
- **Results Transparency:** The Performance Dashboard shows a breakdown of fullscreen exits and tab switches separately.

---

## 📁 Project Structure (Top Level)

```
JobVerse-AI/
├── backend/          # Django + DRF API server
├── frontend/         # React + Vite web app
├── docker-compose.yml
├── .env              # Root-level env (if using Docker)
├── .gitignore
└── README.md
```

---

## 🐳 Docker (Optional)

A `docker-compose.yml` is included for containerized setup:

```bash
docker-compose up --build
```

---

## 📖 Git & Development Notes

- `venv/`, `.env`, and `node_modules/` are all git-ignored — see `.gitignore`.
- Always activate your Python virtual environment before running backend commands.
- The Celery worker **must** be running for any AI feature to work (resume screening, interview generation, aptitude evaluation).
- Media files (uploaded resumes) are stored in `backend/media/resumes/`.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

*Built with ❤️ by the JobVerse Team*
