# City Gol

Base repository for the City Gol MVP.

## Main Docs

- `docs/PROJECT_CONTEXT.md`
- `docs/DEV_SPEC.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/API_ENDPOINTS.md`
- `docs/REPO_STRUCTURE.md`

## Quick Start

```bash
npm install
npm run dev
```

## Environment

Create `.env.local` from `.env.example` and complete:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## First Available Endpoints

- `POST /api/auth/login`
- `GET /api/fields`
- `GET /api/fields/:id/qr-panel`
- `GET /api/users/me`
