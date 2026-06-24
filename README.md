# IELTS Academic Mock-Test Platform

A personal IELTS **Academic** preparation platform. Set an exam date and target band,
take AI-generated **Listening / Reading / Writing** mocks under realistic
computer-delivered (CD) conditions, get auto-graded objective sections plus
AI writing feedback, an estimated overall band, and a focused study plan.

> Bands are **estimates**, not official IELTS scores. Speaking is excluded
> (it remains a face-to-face interview in the real exam).

## Architecture

Monorepo (npm workspaces), two services that run together:

| Service    | Path        | Port   | Stack |
|------------|-------------|--------|-------|
| Frontend   | `frontend/` | `3099` | Next.js (App Router), Tailwind, shadcn-style UI, next-themes, TanStack Query |
| Backend    | `backend/`  | `4099` | Express + TypeScript, Prisma, OpenRouter (LLM), OpenAI TTS |

Auth is **Supabase** (cookie sessions in the frontend via `@supabase/ssr`); the
frontend forwards the Supabase access token to the backend, which verifies the
JWT and scopes every Prisma query to the authenticated user. The
**service-role key and all LLM/TTS keys are server-only** (backend) and never
shipped to the browser. Deterministic scoring lives in code; only writing
quality and feedback come from the model.

```
frontend/ (:3099)  ──fetch + Bearer token──▶  backend/ (:4099)  ──▶  Supabase Postgres (Prisma)
                                                                └──▶  OpenRouter (LLM)
                                                                └──▶  OpenAI (TTS)
```

## Getting started

```bash
# 1. Install (both workspaces)
npm install

# 2. Configure environment
cp .env.example .env      # then fill in Supabase / OpenRouter / OpenAI values

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations (needs DATABASE_URL + DIRECT_URL set)
npm run db:migrate

# 5. Start frontend + backend together
npm run dev
# Frontend → http://localhost:3099
# Backend  → http://localhost:4099/health
```

A single root `.env` is shared by both services (the frontend loads it via
`next.config.ts`, the backend via `dotenv`). Only `NEXT_PUBLIC_*` vars reach the
browser.

## Scripts (root)

| Command              | Description |
|----------------------|-------------|
| `npm run dev`        | Run frontend + backend together |
| `npm run build`      | Build both for production |
| `npm start`          | Start both production servers |
| `npm run db:generate`| Prisma client generation |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm test`           | Backend unit tests (Vitest) |

## Build milestones

1. ✅ **Scaffold** — monorepo, Tailwind + theming + dark mode, env validation, both servers running, health check.
2. ⬜ Data + auth (Supabase `@supabase/ssr`, Prisma migrations, Profile trigger, RLS, route gating).
3. ⬜ OpenRouter + Zod LLM contracts (Reading section end-to-end).
4. ⬜ Scoring core (raw→band, overall rounding) with unit tests.
5. ⬜ Test runner (Listening→Reading→Writing, CD UI, timers, autosave).
6. ⬜ TTS (real cached Listening audio).
7. ⬜ Grading + results (writing grading, band gauge).
8. ⬜ Dashboard + history (countdown, progress chart).
9. ⬜ Profile / settings.
10. ⬜ Practice mode (single-section drilling).
11. ⬜ Polish (a11y, error/empty states, Playwright E2E, deploy).
