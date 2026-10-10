# Shortlist — ATS frontend

React + TypeScript + Vite frontend for the Spring Boot ATS backend (`ats-backend`).
Only three runtime dependencies: `react`, `react-dom`, `react-router-dom`. Styling is plain CSS (`src/index.css`).

## Run it

1. Start MySQL and the backend: `cd ats && mvn spring-boot:run` (port 8080).
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173

In dev, Vite proxies `/api` to `http://localhost:8080` (see `vite.config.ts`), so there are no CORS problems.
Production builds use `VITE_API_URL` from `.env.production`, currently set to
`https://ats-backend-1-h4jl.onrender.com`. If deploying against another backend, update that file or set
`VITE_API_URL` in the hosting provider's build environment. Add the frontend origin to the backend's CORS list
in `SecurityConfig`.

## Screens

| Route | Who | What |
|---|---|---|
| `/jobs`, `/jobs/:id` | Everyone | Server-side search, filter, pagination. Candidates apply with resume + cover letter |
| `/register`, `/login` | Everyone | JWT auth (token kept in localStorage; 401 signs you out) |
| `/my-applications`, `/applications/:id` | Candidate | Stage rail, history timeline, withdraw, resume download |
| `/recruiter/jobs` | Recruiter, Admin | Jobs by status tab; publish, close, edit, delete (admin) |
| `/recruiter/jobs/:id/pipeline` | Recruiter, Admin | Kanban board: move stage, reject with reason, schedule interview, download resume |
| `/applications/:id` | Admin | Also shows "Reopen application" for rejected/withdrawn |

## Test the full flow

1. Register a **recruiter** → Post a job → Publish it (jobs may start as Draft).
2. Sign out, register a **candidate** → open the job → upload a PDF → Submit application.
3. Sign back in as the recruiter → Open pipeline → move the candidate Applied → Screening → Interview.
4. On the Interview card click **Schedule interview** (a future date is required by the backend).
5. Try an illegal move via Swagger/curl (e.g. Applied → Offer) and see the 409 from `StageTransitionValidator`.

## Known limits (backend has no endpoint for these)

- No list of interviews per application, so booked interviews are confirmed on screen but not listed afterwards.
- No dashboard endpoints, so no dashboard page.
- Admin accounts can't be self-registered in the UI. Create one by registering and updating `role` to `ADMIN` in MySQL.
- The recruiter job list filters by `postedByName` because the backend has no "my jobs" endpoint.
