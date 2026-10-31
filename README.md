# 校园智公交 (Campus Smart Bus)

Mobile-first web app showing real-time bus load, stop queue counts, next-arrival capacity, AI travel advice and crowd feedback for campus routes 1 and 2 (simulated data generator). Access starts at a 9-digit student-ID login page (JWT auth).

## Tech stack
- Frontend: React 18 + Vite + Tailwind CSS v4 + shadcn/ui, HashRouter
- Backend: Express (CommonJS, flat `backend/` layout, shares root package.json/tsconfig)
- DB: PostgreSQL via drizzle-orm/postgres-js (only the `crowd_feedback` table)
- AI: `createAIService()` from `backend/services/aiService.ts` (platform-managed, do not edit)

## Structure
```
backend/
  server.ts                         Express entry, mounts /api/transit
  routes/transit.ts                 GET /overview, POST /feedback (5-min rate limit), POST /chat (SSE)
  routes/auth.ts                    POST /api/auth/login|signup (9-digit studentId -> synthetic email `<id>@campus.student`), GET /me
  config/passport.ts, middleware/auth.ts, repositories/users.ts  Auth template (local + jwt strategies), Users table
  services/transitService.ts        Simulated sensor engine, arrivals, advice (rule-based), plans
  services/aiService.ts             Pre-built AI client (do not modify)
  repositories/feedbackRepository.ts crowd_feedback access
  db/schema.ts, db/migrations/      crowd_feedback table + migration
shared/
  campus.ts                         Route stop lists, stop names, capacity, level labels/thresholds
  auth.ts                           STUDENT_ID_PATTERN (9 digits), studentId <-> email helpers
  types/api.ts                      ApiResponse<T>, AuthUser, StudentLogin/SignupRequest, AuthResult
  types/transit.ts                  Transit entity + request/response types
frontend/src/
  App.tsx                           HashRouter + AuthProvider: /login, /signup, / (protected Index, redirects to /login), /preview, /d021aa4a-... and /f7d19c21-... (Preview), * (NotFound)
  contexts/AuthContext.tsx          Token in localStorage('token'), verifies via /api/auth/me
  components/custom/Login.tsx, Signup.tsx, AuthLayout.tsx  Student-ID auth forms (student id kept in localStorage 'campus-student-id' for header display)
  pages/Preview.tsx                 Product intro/preview page with CTA into the app
  pages/NotFound.tsx                Wildcard fallback with links back to / and /preview
  pages/Index.tsx                   Shell: nav, data polling (15s), favorites/stop in localStorage
  pages/HomeView.tsx                My stop, AI advice + basis, next arrivals, plans, college queues, feedback
  pages/RouteView.tsx               Route 1/2 diagram with bus positions, queues, 中和楼 outbound/return segments
  pages/AssistantView.tsx           Natural-language assistant (streams SSE)
  components/custom/TransitParts.tsx CrowdBadge, LoadBar, TrendLabel, Freshness, FeedbackPanel
  lib/api.ts                        apiService (overview, feedback, streamChat)
```

## Features (V1)
- Per-bus load with 4 crowd levels (icon + text + color), capacity 60
- 16 stops / 2 loop routes, queue count + trend, offline-sensor notice (竹苑)
- Next two arrivals per route with remaining seats and "likely / unlikely to board" verdict
- Rule-based advice (marked 简化建议) with basis data and low-confidence warning; peak (早八) demo toggle; closed-hours state
- Crowd feedback fused into bus load estimate; anonymous client id, rate-limited
- AI assistant constrained to campus bus questions with rule-based fallback
- Favorite stops, stale-data (>60s) warning, cached data on network failure

## Deferred (PRD)
Prediction (F6), favorite alerts (F8), admin heatmap dashboard (F10), analytics events.

## Conventions
- API responses: `{ success, data, message? }`; types live in `shared/types`
- Frontend imports shared code via `@shared/...`
- Do not touch `frontend/src/components/ui/`, `frontend/src/index.css`, or package scripts
