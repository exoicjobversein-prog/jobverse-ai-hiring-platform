# JobVerse - AI-Powered Hiring Ecosystem
**Project Presentation Document**

**Team Members:**
- Garveet
- Gouransh
- Dipika
- Gautam

---

## 1. Project Overview
**What is JobVerse?**
JobVerse is a full-stack, AI-powered hiring ecosystem designed to automate and enhance the complete recruitment lifecycle. It bridges the gap between hiring managers (HR) and candidates (Students) by providing intelligent resume screening, automated aptitude assessments, AI-driven context-aware interviews, and robust real-time proctoring.

**Tech Stack:**
- **Backend:** Django Rest Framework (DRF), PostgreSQL/SQLite, Celery, Redis.
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons.
- **AI Integration:** Google Gemini 1.5 Flash API (via `google-generativeai`), TensorFlow.js (`coco-ssd`).

---

## 2. Project Flow & Logic

### Student (Candidate) Flow:
1. **Registration & Dashboard:** Students log in to access the job marketplace and testing centers.
2. **Resume Building:** Students can upload or build their resumes directly on the platform.
3. **Job Marketplace:** Browse and apply for active job postings.
4. **AI-Driven Screening:** Upon application, the AI evaluates the student's resume against the specific job requirements.
5. **Interview Scheduling & Session:** HR schedules an AI interview. At the scheduled time, the student enters a full-screen, dynamic interview session where Gemini API generates questions specifically tailored to their resume and the job role. Answers are evaluated in real-time.
6. **Aptitude Practice & Tests:** Students can take category-specific tests or an 80-question full-readiness test, heavily monitored by the AI Proctoring Engine.
7. **Workshops & Community:** Participate in real-time peer chats and browse upskilling workshops.

### HR (Recruiter) Flow:
1. **Job Management:** HR can post, edit, and delete job listings.
2. **Application Tracking:** View candidates who have applied for specific roles.
3. **AI Resume Screening:** Instantly see the AI Match Score and summary for each applicant based on the job requirements.
4. **Interview Management:** Schedule AI interviews and track candidate responses (Accepted/Pending).
5. **Results & Analytics:** After a candidate completes tests or interviews, HR views detailed reports, complete with performance scores, domain breakdowns, strengths, weaknesses, and a final hiring recommendation.

---

## 3. Core File Structure

```text
JobVerse-AI/
├── backend/                  # Django + DRF API Server
│   ├── core/                 # Django settings, URL configurations, ASGI/WSGI
│   ├── apps/                 # Modular Django Applications
│   │   ├── users/            # Custom user model handling Student/HR roles & JWT auth
│   │   ├── jobs/             # Job postings, candidate applications, UI resume screening
│   │   ├── resumes/          # Resume storage and AI summary generation logic
│   │   ├── interviews/       # AI Interviews, Practice Interviews, Aptitude Tests models
│   │   ├── proctoring/       # Violation logs and recording endpoints
│   │   └── workshops/        # Workshop enrollment models
│   └── services/
│       └── ai_service.py     # Centralized Google Gemini API interactions
├── frontend/                 # React + Vite Web Application
│   └── src/
│       ├── components/       # Reusable UI elements (e.g., ProctoringMonitor)
│       ├── pages/            # Main application views
│       │   ├── hr/           # HR Dashboard, PostJob, Candidate Applications, Analytics
│       │   └── student/      # Student Dashboard, AptitudePractice, InterviewSession
│       ├── services/         # Axios API clients
│       └── App.jsx           # React Router definitions
```

---

## 4. Advanced AI Proctoring Logic (In Detail)

A critical and highly sophisticated aspect of JobVerse is ensuring testing integrity during Aptitude Tests and AI Interviews. The proctoring system is multi-layered and enforces strict anti-cheat mechanisms.

### A. AI Detection Engine (Visual)
Implemented using `@tensorflow-models/coco-ssd` running entirely on the client-side within the `ProctoringMonitor.jsx` component. Let's break down the rules:
- **Object Detection (Severe):** The webcam continuously scans the candidate globally. If the AI detects a **"Cell Phone"** or **"Multiple Persons"**, it instantly flags a "Severe" violation.
- **No-Face Detection (Strike System):** If the system detects 0 persons (candidate's face drops out of frame) continuously for 10 seconds, a warning strike is issued. Accumulating 5 "No Face" strikes escalates to a "Severe" violation. This accounts for dropping a pen or briefly sneezing without terminating the test unfairly.

### B. Audio Noise & Hardware Monitoring
- **Noise Detection (`AudioContext`):** The system connects directly to the active microphone stream and analyzes FFT frequency data. To avoid sudden spikes or mic bumps, it analyzes ambient noise volume and requires a continuous 4-second period of loud noise or multiple voices to trigger a "Severe" violation. It includes a decay timer so brief pauses between speech do not fully reset the detection.
- **Hardware Disconnects:** Continuous active tracking of the `MediaStream` tracks (`video.readyState`, camera enabled vs visually disabled). If a user maliciously revokes permission, unplugs a camera/microphone, or software-disables the device mid-test, the system detects the dropped tracks and flags a "Severe" violation instantly.

### C. Suspicious Action "Strike" System (Event-Based)
Monitors the browser environment for cheating attempts outside the camera feed.
- **Action Triggers:** 
  1. Exiting Fullscreen (`fullscreenchange` event).
  2. Switching browser tabs or minimizing the window (`visibilitychange` event).
  3. Attempting to use OS-level screenshot tools (e.g., Snipping Tool `Win+Shift+S`, Windows `Print Screen`, MacOS `Cmd+Shift+4`).
  4. Attempting to Copy, Cut, Paste, or Right-Click within the test window.
- **The 3-Strike Rule:** All of the above actions share a unified warning pool. Accumulating 3 total strikes across any combination of these actions results in test termination.

### D. Enforcement & Centralized Logging
- **Auto-Submission Protocol:** If a "Severe" AI violation occurs or the 3-strike Suspicious Action limit is reached, a red warning overlay locks the screen and blocks all inputs. A timeout occurs, and the test is immediately auto-submitted to the backend.
- **JSON Telemetry Array:** Instead of sending numerical penalty counts, the frontend maintains a comprehensive `proctoring_logs` tracking array in state. As events happen, it pushes a highly detailed object: `[{"type": "tab_switch", "severity": "warning", "timestamp": "...", "message": "..."}]`.
- **Results Dashboard Verification:** The HR analytics dashboard takes the JSON payload and dynamically renders the exact timestamps, violation types, and severity tags via `map()`, ensuring total transparency for reviewers on *why* a candidate was flagged or terminated.
