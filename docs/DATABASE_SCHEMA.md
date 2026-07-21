# City Gol - Database Schema

## Database

- Engine: `PostgreSQL`
- Platform: `Supabase`
- ORM: `Drizzle ORM`

This document defines the current schema shape after moving authentication to Supabase Auth.

## Key Design Choice

Authentication credentials live in Supabase Auth.
Business profile data lives in the application `users` table.

The `users` table includes `auth_user_id` to map one application profile to one Supabase Auth user.

## Enums

### `user_role`

- `user`
- `admin`

### `field_type`

- `futbol5`
- `futbol8`

### `booking_status`

- `scheduled`
- `cancelled`
- `closed`

### `join_request_status`

- `pending`
- `accepted`
- `rejected`
- `cancelled`

### `score_type`

- `total`
- `monthly`
- `vigente`

## Tables

### `users`

Purpose: app-specific profile, role, and score state.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | App user id |
| auth_user_id | uuid | unique, nullable | Supabase Auth user UUID |
| first_name | text | not null | |
| last_name | text | not null | |
| email | text | not null, unique | Also used by auth |
| phone | text | not null, unique | Required business field |
| birth_date | date | not null | |
| role | user_role | not null, default `user` | |
| score_total | integer | not null, default 0 | |
| score_monthly | integer | not null, default 0 | |
| score_vigente | integer | not null, default 0 | |
| is_active | boolean | not null, default true | Logical activation |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |

Indexes:

- unique `users_auth_user_id_unique`
- unique `users_email_unique`
- unique `users_phone_unique`

### `teams`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| name | text | not null |
| owner_user_id | uuid | fk -> users.id |
| is_active | boolean | default true |
| created_at | timestamptz | not null |
| updated_at | timestamptz | not null |

### `team_members`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| team_id | uuid | fk -> teams.id |
| user_id | uuid | fk -> users.id |
| joined_at | timestamptz | not null |
| left_at | timestamptz | nullable |
| is_active | boolean | default true |

### `team_join_requests`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| team_id | uuid | fk -> teams.id |
| user_id | uuid | fk -> users.id |
| status | join_request_status | default `pending` |
| created_at | timestamptz | not null |
| resolved_at | timestamptz | nullable |

### `fields`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| name | text | not null |
| slug | text | unique |
| field_type | field_type | not null |
| default_checkin_limit | integer | not null |
| image_url | text | nullable |
| display_order | integer | default 0 |
| is_active | boolean | default true |
| created_at | timestamptz | not null |
| updated_at | timestamptz | not null |

### `system_settings`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| booking_duration_minutes | integer | not null |
| grace_minutes | integer | not null |
| updated_by_user_id | uuid | fk -> users.id |
| updated_at | timestamptz | not null |

### `bookings`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| field_id | uuid | fk -> fields.id |
| team_id | uuid | nullable, fk -> teams.id |
| starts_at | timestamptz | not null |
| ends_at | timestamptz | not null |
| valid_from | timestamptz | not null |
| valid_until | timestamptz | not null |
| qr_token | text | unique |
| checkin_limit_snapshot | integer | not null |
| status | booking_status | default `scheduled` |
| created_at | timestamptz | not null |
| updated_at | timestamptz | not null |

### `checkins`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| booking_id | uuid | fk -> bookings.id |
| user_id | uuid | fk -> users.id |
| field_id | uuid | fk -> fields.id |
| checked_in_at | timestamptz | not null |
| created_at | timestamptz | not null |

Important constraint:

- unique `(booking_id, user_id)`

### `score_adjustments`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| user_id | uuid | fk -> users.id |
| admin_user_id | uuid | fk -> users.id |
| score_type | score_type | not null |
| delta | integer | not null |
| reason | text | not null |
| created_at | timestamptz | not null |

### `redemptions`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| user_id | uuid | fk -> users.id |
| admin_user_id | uuid | fk -> users.id |
| points_spent | integer | not null |
| description | text | not null |
| created_at | timestamptz | not null |

### `email_notifications`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| team_id | uuid | nullable, fk -> teams.id |
| booking_id | uuid | nullable, fk -> bookings.id |
| recipient_email | text | not null |
| template_type | text | not null |
| status | text | not null |
| provider_message_id | text | nullable |
| created_at | timestamptz | not null |

### `admin_audit_logs`

| Column | Type | Constraints |
|---|---|---|
| id | uuid | pk |
| admin_user_id | uuid | fk -> users.id |
| action | text | not null |
| entity_type | text | not null |
| entity_id | uuid | not null |
| metadata_json | jsonb | nullable |
| created_at | timestamptz | not null |

## Score Rules

### On valid check-in

- `score_total += 1`
- `score_monthly += 1`
- `score_vigente += 1`

### On manual score adjustment

- update only the selected score bucket
- write a row to `score_adjustments`

### On redemption

- `score_vigente -= points_spent`
- insert a row into `redemptions`

### On check-in deletion

- reverse score impact according to business rules

## Current Seed

Current demo seed creates:

- 3 auth users in Supabase Auth
- 3 app profiles in `users`
- 2 fields
- 1 settings row
- 1 team
- 3 bookings with QR tokens: `prev123`, `cur123`, `next123`
