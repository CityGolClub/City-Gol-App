# City Gol - Repo Structure

## Goal

This document explains the initial repository layout and what belongs in each directory so backend and frontend can work in parallel without stepping on each other.

## Root Structure

```txt
docs/
drizzle/
mocks/
public/
src/
```

## `docs/`

Project documentation and implementation references.

Expected files:

- `PROJECT_CONTEXT.md`: product rules and business context
- `DEV_SPEC.md`: technical architecture and implementation rules
- `DATABASE_SCHEMA.md`: database design
- `API_ENDPOINTS.md`: API contracts and payloads
- `REPO_STRUCTURE.md`: this file

Use this folder for decisions that must stay stable across backend and frontend work.

## `drizzle/`

Database-related source of truth.

What goes here:

- Drizzle schema files
- migrations
- seed scripts
- database helpers used only for schema/bootstrap tasks

Do not put UI or route code here.

## `mocks/`

Official mock payloads for frontend development.

Recommended files:

- `fields.json`
- `qr-panel-field-1.json`
- `me.json`
- `teams-search.json`
- `admin-users.json`
- `admin-bookings.json`
- `system-settings.json`

This folder is especially important for the trainee working on frontend.

## `public/`

Static assets served directly by Next.js.

What goes here:

- temporary static field images if needed during early development
- icons
- fallback assets

Do not use `public/` for long-term user-uploaded assets if those should live in Supabase Storage.

## `src/`

Main application source code.

### `src/app/`

Next.js App Router structure.

What goes here:

- route segments
- page files
- layouts
- loading states
- server route handlers under `api/`

Suggested layout:

```txt
src/app/
  (public)/
    login/
    qr/
  panel/
  admin/
  api/
```

### `src/components/`

Reusable UI components that are not owned by a single domain.

Examples:

- buttons
- cards
- tables
- dialogs
- shared layout pieces

The trainee will likely spend a lot of time here.

### `src/modules/`

Domain-oriented application code.

Suggested modules:

- `auth/`
- `users/`
- `teams/`
- `fields/`
- `bookings/`
- `checkins/`
- `admin/`
- `notifications/`
- `redemptions/`
- `settings/`

Inside each module, prefer structure like:

```txt
module-name/
  domain/
  application/
  infrastructure/
  ui/
```

Meaning:

- `domain/`: rules, entities, invariants
- `application/`: use cases and orchestration
- `infrastructure/`: DB queries, providers, external integrations
- `ui/`: module-specific components or hooks

### `src/lib/`

Cross-cutting technical helpers.

Suggested subfolders:

- `db/`: DB client and shared data helpers
- `auth/`: session helpers, guards, auth utilities
- `storage/`: Supabase Storage helpers for field images
- `validations/`: shared `zod` schemas
- `utils/`: generic utilities
- `constants/`: shared constants and enums if not domain-specific
- `types/`: shared DTO/types used across app boundaries

Rule:

- if the logic belongs to one business domain, prefer `src/modules/`
- if the logic is technical and shared, prefer `src/lib/`

## Ownership Guidance

### Backend owner

Primary responsibility:

- `drizzle/`
- `src/app/api/`
- `src/modules/*/domain`
- `src/modules/*/application`
- `src/modules/*/infrastructure`
- `src/lib/db`
- `src/lib/auth`
- `src/lib/storage`
- docs that define contracts and rules

### Frontend trainee

Primary responsibility:

- `src/app/(public)/`
- `src/app/panel/`
- `src/app/admin/`
- `src/components/`
- `src/modules/*/ui`
- consuming `mocks/` first, then real endpoints

## Working Agreement

To avoid blocking the frontend:

- backend defines stable response shapes first
- frontend builds screens against `mocks/`
- when real endpoints are ready, frontend swaps data source with minimal UI changes

## First Files To Create

Recommended first implementation files:

- `drizzle/schema.ts`
- `drizzle/seed.ts`
- `src/lib/db/client.ts`
- `src/lib/auth/session.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/fields/route.ts`
- `src/app/api/fields/[id]/qr-panel/route.ts`
- `src/app/api/users/me/route.ts`
- `src/app/api/checkins/by-token/route.ts`
- `mocks/fields.json`
- `mocks/qr-panel-field-1.json`
- `mocks/me.json`

## Rule of Thumb

- screens and UX states can start with mocks
- contracts and business rules must come from docs and backend
- database, auth, check-in rules, and score updates should stay centralized and authoritative in backend code
