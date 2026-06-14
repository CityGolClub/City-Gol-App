# City Gol - Developer Specification

## Purpose

This document describes the current technical architecture for implementing City Gol after the auth refactor to email/password with Supabase Auth.

## Recommended Stack

- `Next.js 15`
- `TypeScript`
- `PostgreSQL` on Supabase
- `Drizzle ORM`
- `Supabase Auth`
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
scripts/
src/
  app/
    (public)/
      login/
      register/
      forgot-password/
      reset-password/
      qr/
    panel/
    admin/
    api/
  components/
  modules/
  lib/
```

## Authentication Model

### Supabase Auth responsibilities

- sign up
- sign in with email + password
- forgot password email
- password reset

### Application `users` table responsibilities

- first name
- last name
- email
- phone
- birth date
- role
- score_total
- score_monthly
- score_vigente
- is_active
- `auth_user_id`

Recommended mapping:

- `users.auth_user_id` references the Supabase Auth user UUID logically
- `users.id` stays as the app's internal user UUID

## Main Entities

### `users`

- `id`
- `auth_user_id` nullable for migration compatibility, intended for all real accounts
- `first_name`
- `last_name`
- `email`
- `phone`
- `birth_date`
- `role`
- `score_total`
- `score_monthly`
- `score_vigente`
- `is_active`
- `created_at`
- `updated_at`

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
- `left_at`
- `is_active`

### `team_join_requests`

- `id`
- `team_id`
- `user_id`
- `status`
- `created_at`
- `resolved_at`

### `fields`

- `id`
- `name`
- `slug`
- `field_type`
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
- `status`
- `created_at`
- `updated_at`

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
- `score_type`
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

## Core Domain Rules

### Auth

- login uses email + password
- registration requires first name, last name, email, phone, birth date, password
- phone is required but not a credential
- password recovery uses Supabase recovery email
- the check-in flow preserves `redirect=/checkin/:token`

### Check-In

- `GET /api/checkin/:token` is public/read-only
- `POST /api/checkin/confirm` requires authenticated session
- check-in no longer creates users automatically
- after login/register, the user returns to the original QR flow and confirms check-in

### Scores

- valid check-in increments total/monthly/vigente
- monthly is based on current calendar month
- redemptions affect only vigente
- manual changes are logged separately

### QR Visibility

- backend returns all visible bookings for a field
- because grace is configurable, up to 3 QR codes may coexist: previous, current, next

## Recommended Constraints

- unique `users.auth_user_id`
- unique `users.email`
- unique `users.phone`
- unique `fields.slug`
- unique `bookings.qr_token`
- unique composite `checkins (booking_id, user_id)`

## Auth and Session Strategy

- Supabase Auth stores credentials
- backend stores a custom httpOnly session cookie with the app user id
- backend resolves profile from `users.id`
- `users.auth_user_id` links the app profile to Supabase Auth user

## Suggested API Surface

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Check-In

- `GET /api/checkin/:token`
- `POST /api/checkin/confirm`

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

### Fields and QR panel

- `GET /api/fields`
- `GET /api/fields/:id/qr-panel`
- `POST /api/admin/fields`
- `PATCH /api/admin/fields/:id`
- `DELETE /api/admin/fields/:id`

### Settings

- `GET /api/admin/settings`
- `PATCH /api/admin/settings`

### Bookings

- `GET /api/admin/bookings`
- `POST /api/admin/bookings`
- `PATCH /api/admin/bookings/:id`
- `DELETE /api/admin/bookings/:id`

### Redemptions and Exports

- `POST /api/admin/redemptions`
- `GET /api/admin/redemptions`
- `GET /api/admin/exports/checkins.xlsx?from=&to=&fieldId=&teamId=`

### Notifications

- `POST /api/jobs/send-reminders`
- `GET /api/admin/notifications/logs`

## Verification Priorities

Before moving to QR dynamic UI, verify these backend flows:

1. register creates Supabase Auth user + app profile
2. login creates app session cookie
3. forgot password sends recovery email
4. reset password updates credentials
5. check-in confirm requires session
6. check-in confirm increments scores correctly
7. `GET /api/users/me` returns panel payload for the authenticated app user
