# City Gol - Developer Specification

## Purpose

This document describes the recommended technical structure for implementing City Gol.
It is intended for developers and coding agents that need clear implementation guidance.

## Recommended Stack

- `Next.js 15`
- `TypeScript`
- `PostgreSQL` on Supabase
- `Drizzle ORM`
- `Supabase Storage`
- `Tailwind CSS`
- `shadcn/ui`
- `Resend`
- `Vercel`
- `SheetJS` or `ExcelJS` for `.xlsx` export

## Architecture Style

Recommended approach: modular monolith.

Keep frontend, backend, auth, admin, and scheduled logic inside one repository and one deployable app for the MVP.

## Suggested Project Structure

```txt
docs/
drizzle/
mocks/
public/
src/
  app/
    (public)/
      login/
      qr/
    panel/
    admin/
    api/
  components/
  modules/
    auth/
    users/
    teams/
    fields/
    bookings/
    checkins/
    admin/
    notifications/
    redemptions/
    settings/
  lib/
    db/
    auth/
    storage/
    validations/
    utils/
    constants/
    types/
```

## Layering

Within each domain module, prefer this separation:

- `domain/` for core rules and entities
- `application/` for use cases and orchestration
- `infrastructure/` for DB/providers/external services
- `ui/` when the module owns reusable UI pieces

## Main Modules

- `auth`
- `users`
- `teams`
- `fields`
- `bookings`
- `checkins`
- `admin`
- `notifications`
- `redemptions`
- `settings`

## Main Entities

### `users`

Recommended fields:

- `id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `birth_date`
- `role` (`user | admin`)
- `score_total`
- `score_monthly`
- `score_vigente`
- `is_active`
- `created_at`
- `updated_at`

Notes:

- no profile image fields
- no avatar storage

### `teams`

- `id`
- `name`
- `owner_user_id`
- `is_active`
- `created_at`
- `updated_at`

### `team_members`

- `id`
- `team_id`
- `user_id`
- `joined_at`
- `left_at` nullable
- `is_active`

Rules:

- one user can belong to only one active team

### `team_join_requests`

- `id`
- `team_id`
- `user_id`
- `status` (`pending | accepted | rejected | cancelled`)
- `created_at`
- `resolved_at`

### `fields`

- `id`
- `name`
- `slug`
- `field_type` (`futbol5 | futbol8`)
- `default_checkin_limit`
- `image_url`
- `display_order`
- `is_active`
- `created_at`
- `updated_at`

### `system_settings`

- `id`
- `booking_duration_minutes`
- `grace_minutes`
- `updated_by_user_id`
- `updated_at`

Rules:

- one active settings row for the MVP
- `grace_minutes <= 30`

### `bookings`

- `id`
- `field_id`
- `team_id` nullable
- `starts_at`
- `ends_at`
- `valid_from`
- `valid_until`
- `qr_token`
- `checkin_limit_snapshot`
- `status` (`scheduled | cancelled | closed`)
- `created_at`
- `updated_at`

Rules:

- bookings must not overlap on the same field
- `valid_from` and `valid_until` are computed using the system grace value at creation time

### `checkins`

- `id`
- `booking_id`
- `user_id`
- `field_id`
- `checked_in_at`
- `created_at`

### `score_adjustments`

- `id`
- `user_id`
- `admin_user_id`
- `score_type` (`total | monthly | vigente`)
- `delta`
- `reason`
- `created_at`

### `redemptions`

- `id`
- `user_id`
- `admin_user_id`
- `points_spent`
- `description`
- `created_at`

### `email_notifications`

- `id`
- `team_id`
- `booking_id`
- `recipient_email`
- `template_type`
- `status`
- `provider_message_id`
- `created_at`

### `admin_audit_logs`

- `id`
- `admin_user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata_json`
- `created_at`

## Core Domain Rules

### Auth and Registration

- login uses `email + phone`
- both are required in the MVP
- registration form includes first name, last name, email, phone, and birth date
- there is no password in the MVP flow
- this auth method must be treated as temporary and replaced later by stronger verification

### Teams

- the creator of a team becomes its owner
- only the owner can accept or reject join requests
- only the owner can transfer ownership
- the owner may leave only after transferring ownership to another active member
- if the owner is the only member, team deletion is the simplest exit path

### Fields

- admin manages fields from the admin panel
- `default_checkin_limit` is global per field
- field images are allowed
- images should be uploaded to Supabase Storage and referenced by URL/path
- no custom per-booking limit override for now

### System Settings

- booking duration is global
- grace minutes are global
- settings changes affect only new bookings
- `grace_minutes` max is `30`

### Bookings

- bookings may optionally be linked to a team
- `team_id` must be nullable
- check-in remains open to any valid user regardless of team membership
- each booking gets its own `qr_token`
- each booking stores `checkin_limit_snapshot`
- overlapping bookings on the same field are forbidden

### QR Visibility

- the backend must return all currently visible bookings for a field
- because grace is configurable, up to 3 QR codes may coexist: previous, current, next
- QR remains visually present even if the booking is full
- backend still blocks further check-ins once full

### QR Validity Window

- `valid_from = starts_at - grace_minutes`
- `valid_until = ends_at + grace_minutes`

### Check-In Rules

A check-in is valid only if:

- booking exists for the QR token
- current time is inside `[valid_from, valid_until]`
- booking is not full
- user has not already checked in for that booking

If valid:

- insert check-in record
- increment `score_total`
- increment `score_monthly`
- increment `score_vigente`

If invalid:

- return a business-friendly message to the UI
- do not expose it as a technical failure when the system itself is healthy

### Score Rules

- automatic: `+1` to `score_total`, `score_monthly`, and `score_vigente` for each valid check-in
- manual: admin can add or subtract points
- manual changes must be recorded in `score_adjustments`
- redemption subtracts only from `score_vigente`
- deleting a check-in must reverse score impact accordingly
- `score_monthly` refers to the current calendar month

## Recommended Constraints

- unique `users.email`
- unique `fields.slug`
- unique `bookings.qr_token`
- unique composite on `checkins (booking_id, user_id)`
- only one active team membership per user
- no booking overlaps on the same field

## Concurrency Requirements

Check-in creation must be transaction-safe.

The backend must prevent race conditions where multiple users try to consume the last available slot at the same time.

Recommended flow inside a transaction:

1. load booking by token
2. verify validity window
3. verify user has no existing check-in for that booking
4. count current check-ins
5. compare against `checkin_limit_snapshot`
6. insert check-in
7. increment score values

## Suggested API Surface

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `POST /api/admin/users/:id/score-adjustments`

### Teams

- `POST /api/teams`
- `GET /api/teams/search?q=`
- `POST /api/teams/:id/join-request`
- `GET /api/teams/:id/join-requests`
- `POST /api/teams/:id/join-requests/:requestId/accept`
- `POST /api/teams/:id/join-requests/:requestId/reject`
- `POST /api/teams/:id/transfer-ownership`
- `POST /api/teams/:id/leave`
- `DELETE /api/teams/:id`

### Fields

- `GET /api/fields`
- `POST /api/admin/fields`
- `PATCH /api/admin/fields/:id`
- `DELETE /api/admin/fields/:id`
- `GET /api/fields/:id/qr-panel`

### Settings

- `GET /api/admin/settings`
- `PATCH /api/admin/settings`

### Bookings

- `GET /api/admin/bookings`
- `POST /api/admin/bookings`
- `PATCH /api/admin/bookings/:id`
- `DELETE /api/admin/bookings/:id`

### Check-Ins

- `POST /api/checkins/by-token`
- `GET /api/checkins/me`
- `DELETE /api/admin/checkins/:id`

### Redemptions

- `POST /api/admin/redemptions`
- `GET /api/admin/redemptions`

### Exports

- `GET /api/admin/exports/checkins.xlsx?from=&to=&fieldId=&teamId=`

### Notifications

- `POST /api/jobs/send-reminders`
- `GET /api/admin/notifications/logs`

## Permissions Model

### Regular User

- manage own profile
- create team
- browse teams
- request team membership
- perform check-in
- view own score and history

### Admin

- manage users
- adjust score
- register redemptions
- manage fields
- manage global settings
- manage bookings
- delete invalid check-ins
- export check-in data
- inspect logs and operational data

Implementation recommendation:

- use `users.role`
- avoid hardcoded credentials in code

## QR Panel Response Shape

Recommended response for `GET /api/fields/:id/qr-panel`:

```json
{
  "field": {
    "id": "field_1",
    "name": "Cancha 1",
    "fieldType": "futbol5"
  },
  "visibleBookings": [
    {
      "id": "booking_prev",
      "startsAt": "2026-06-06T17:00:00.000Z",
      "endsAt": "2026-06-06T18:00:00.000Z",
      "validFrom": "2026-06-06T16:30:00.000Z",
      "validUntil": "2026-06-06T18:30:00.000Z",
      "qrToken": "prev123",
      "checkinsUsed": 10,
      "checkinLimit": 10,
      "isFull": true,
      "displayKind": "previous"
    },
    {
      "id": "booking_current",
      "startsAt": "2026-06-06T18:00:00.000Z",
      "endsAt": "2026-06-06T19:00:00.000Z",
      "validFrom": "2026-06-06T17:30:00.000Z",
      "validUntil": "2026-06-06T19:30:00.000Z",
      "qrToken": "cur123",
      "checkinsUsed": 7,
      "checkinLimit": 10,
      "isFull": false,
      "displayKind": "current"
    },
    {
      "id": "booking_next",
      "startsAt": "2026-06-06T19:00:00.000Z",
      "endsAt": "2026-06-06T20:00:00.000Z",
      "validFrom": "2026-06-06T18:30:00.000Z",
      "validUntil": "2026-06-06T20:30:00.000Z",
      "qrToken": "next123",
      "checkinsUsed": 0,
      "checkinLimit": 10,
      "isFull": false,
      "displayKind": "next"
    }
  ]
}
```

## UI Notes

### Login Form

Must include:

- email
- phone

### Registration/Profile Form

Must include:

- first name
- last name
- email
- phone
- birth date

Must not include:

- profile image input
- avatar upload

### Tablet Field Selector

- show all active fields as cards
- each card may use the field image
- choosing a field opens the QR screen for that field

### Tablet QR Screen

- render all visible bookings returned by the backend
- highlight the main current booking visually
- show occupancy counter
- keep full bookings visible with a clear state label

## Deletion Strategy

Recommended behavior:

- avoid hard deletes for fields with historical bookings
- prefer `is_active = false`
- preserve historical check-ins and exports

## Email Reminder Notes

- reminders are sent through Resend
- target all emails belonging to the team associated with a booking
- if a booking has no team, reminders are skipped for now

## Recommended Next Docs

These documents should exist alongside this specification:

- `docs/DATABASE_SCHEMA.md`
- `docs/API_ENDPOINTS.md`
- `docs/REPO_STRUCTURE.md`
