# AgriVision

A voice-first assistant and mandi price marketplace for farmers, supporting Hindi, Marathi,
Punjabi and Gujarati end to end (speech in, speech out, and UI text).

## Architecture

- **frontend/** — Next.js (App Router, TypeScript) UI: role-based dashboards for farmers, mandi
  heads and admins.
- **backend/** — Node.js (Fastify + Prisma + PostgreSQL) API: auth, roles, mandi prices,
  listings, and voice-intent dispatch.
- **llm-service/** — Python (FastAPI) microservice wrapping the SarvamAI SDK: speech-to-text,
  intent/entity extraction, and text-to-speech. Called internally by the backend only.
- **packages/shared-types/** — TypeScript types shared between `frontend` and `backend`.

Voice flow: browser records audio → `backend` (`/voice/interact`, authenticated) → `llm-service`
(`/process` for STT + intent) → `backend` resolves the intent against real DB data (price
lookup, new listing, or price update) → `llm-service` (`/speak` for TTS) → `backend` returns the
transcript, reply text and reply audio (base64) in one response.

## Prerequisites

- Node.js 20+ and npm
- Python 3.12 (via the `py` launcher on Windows)
- Docker Desktop (used only to run a local Postgres container)
- A Sarvam AI API key (https://sarvam.ai)

## First-time setup

```bash
# 1. Install Node dependencies for all workspaces (frontend, backend, shared-types)
npm install

# 2. Start Postgres
npm run db:up

# 3. Backend: configure env, migrate, seed
cp .env.example backend/.env   # then edit backend/.env if needed
cd backend
npm run prisma:migrate
npm run prisma:seed
cd ..

# 4. Python LLM service: venv + deps + Sarvam key
cd llm-service
py -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # .venv/bin/pip on macOS/Linux
echo 'SARVAM_API_KEY="your-key-here"' > .env
echo 'INTERNAL_API_KEY="<same value as backend/.env INTERNAL_API_KEY>"' >> .env
cd ..

# 5. Frontend env
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > frontend/.env.local
```

The seed script creates three demo accounts (phone / role) and four mandis across Maharashtra
(Pune, Nashik, Solapur, Ahmednagar) with real coordinates, so the map and nearest-mandi features
have something to show:

| Phone        | Role       |
|--------------|------------|
| 9999900000   | ADMIN      |
| 9999900001   | MANDI_HEAD (Pune APMC Mandi) |
| 9999900002   | FARMER     |

Login uses phone + OTP; in development the OTP is printed to the backend console and also
returned in the API response (`devOtp`) so the login page can show it directly.

## Running

The easiest way, from the repo root:

```bash
npm run all
```

This starts Postgres (via Docker), waits for it to accept connections, then runs the backend,
frontend and llm-service together with labeled, color-coded output (`[db]`, `[backend]`,
`[frontend]`, `[llm]`). Press `Ctrl+C` once to stop all of them (the Postgres container itself
keeps running for next time — use `npm run db:down` to stop it too).

Requires the one-time setup above to be done first, including the `llm-service/.venv` virtualenv
— `npm run all` will tell you if it's missing.

Alternatively, run each service independently in its own terminal:

```bash
# Terminal 1
npm run db:up
cd backend && npm run dev        # http://localhost:4000

# Terminal 2
cd llm-service && .venv/Scripts/python -m uvicorn app.main:app --port 8000

# Terminal 3
cd frontend && npm run dev       # http://localhost:3000
```

Then open http://localhost:3000.

## Maps and the profit calculator

- **Nearby Mandis** (`/farmer/mandis` for farmers, `/mandi/nearby` for mandi heads) shows a
  Leaflet + OpenStreetMap map (no API key needed) centered on the browser's geolocation, with
  every mandi plotted and sorted by distance (`GET /mandis/nearest`). Selecting a mandi loads its
  live price board.
- **Admin → Mandis** shows the same map plus a table to add a mandi (with optional
  latitude/longitude) and remove/restore one. "Remove" is a soft delete (`DELETE /mandis/:id`
  sets `isActive: false`) — existing price history and listings are never destroyed, the mandi
  just stops appearing to farmers and mandi heads until an admin restores it.
- **Profit Calculator** (`/farmer/profit-calculator`) estimates sell-now vs. wait-N-days net
  profit for a crop at a mandi, using the mandi's real price history for a simple trend
  projection, minus a configurable commission rate and storage cost
  (`backend/src/lib/profitConstants.ts`). It's a decision-support estimate, not a guarantee —
  there's no live weather, buyer or transport data behind it.
- These three surfaces are built with Material UI (`@mui/material`); the rest of the app
  (auth, voice recorder, drag-and-drop price list) stays on the existing Tailwind styling.

## Notes

- `INTERNAL_API_KEY` must match between `backend/.env` and `llm-service/.env` — it's the shared
  secret the backend uses to authenticate to the Python service.
- The crop catalog recognized by the voice intent extractor (`llm-service/app/intent/prompt.py`)
  mirrors the crops seeded in `backend/prisma/seed.ts`. Adding a new crop requires updating both.
- Real SMS delivery for OTP is not implemented — swap it in inside
  `backend/src/modules/auth/otp.service.ts`.
