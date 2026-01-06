# HackUMass — AI Graded Assignments

## Overview

This repository contains a full-stack product designed to simplify grading for instructors and streamline submission for students. At a high level:

- Professors: upload question PDFs and their scoring rubrics once through the instructor UI. The system stores question files and rubrics in Supabase and associates them with an assignment.
- Students: submit their completed assignments (PDF, photos or scans) via the student-facing upload flow in the frontend.
- One-click grading: instructors can trigger automated grading for an entire assignment (or a single student) with a single action. The backend uses Google Gemini to transcribe handwritten work and the rubric, then applies the rubric to each student's answers to produce numeric scores and structured feedback.

Benefits and outcomes:

- Saves instructor time by automating repetitive transcription and scoring tasks.
- Produces per-question scores, short reasons for each score, and constructive improvement suggestions for students.
- Stores graded results per submission in Supabase so instructors can review results, export reports, or release feedback to students.

The frontend is a Next.js app and the backend is a FastAPI service that handles uploads, transcription, and grading workflows.

## Tech stack

- Frontend: Next.js (React) — located in the `frontend/` folder
- Backend: FastAPI (Python) — located in the `backend/` folder
- AI: Google Gemini via the `google-generativeai` Python client
- Storage / DB: Supabase (used for assignment and submission storage)

## Repository structure

- `frontend/` — Next.js app and UI components
- `backend/` — FastAPI server and helper scripts
  - `backend/fastapi_app/main.py` — primary FastAPI application and HTTP endpoints
  - `backend/fastapi_app/ai_utils.py` — AI integration, transcription and grading helpers
  - `backend/transcribe.py` — command-line transcription helper

```

