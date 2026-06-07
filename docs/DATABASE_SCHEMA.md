# City Gol - Database Schema

## Database

- Engine: `PostgreSQL`
- Platform: `Supabase`
- ORM: `Drizzle ORM`

This document defines the recommended initial schema for the City Gol MVP.

## Design Principles

- prefer logical deletion over destructive deletion when business history matters
- preserve booking history even if field settings change later
- preserve score history for manual adjustments and redemptions
- make check-in writes transaction-safe

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

Purpose: registered users, admins, and user score state.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | Generated ID |
| first_name | text | not null | |
| last_name | text | not null | |
| email | text | not null, unique | Login identifier |
| phone | text | not null | Second login identifier |
| birth_date | date | not null | |
| role | user_role | not null, default `user` | |
| score_total | integer | not null, default 0 | Historical accumulated score |
| score_monthly | integer | not null, default 0 | Current calendar month score |
| score_vigente | integer | not null, default 0 | Redeemable score |
| is_active | boolean | not null, default true | Logical activation |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |

Indexes:

- unique index on `email`
- index on `role`
- index on `is_active`

### `teams`

Purpose: team ownership and high-level team metadata.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| name | text | not null | |
| owner_user_id | uuid | not null, fk -> users.id | Team owner |
| is_active | boolean | not null, default true | Logical deletion |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |

Indexes:

- index on `owner_user_id`
- index on `is_active`

### `team_members`

Purpose: membership history and current active membership.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| team_id | uuid | not null, fk -> teams.id | |
| user_id | uuid | not null, fk -> users.id | |
| joined_at | timestamptz | not null | |
| left_at | timestamptz | null | Null while active |
| is_active | boolean | not null, default true | |

Indexes:

- index on `team_id`
- index on `user_id`
- partial unique index on active membership per user

Rule:

- a user can have only one active membership at a time

### `team_join_requests`

Purpose: track pending and resolved join requests.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| team_id | uuid | not null, fk -> teams.id | |
| user_id | uuid | not null, fk -> users.id | |
| status | join_request_status | not null, default `pending` | |
| created_at | timestamptz | not null | |
| resolved_at | timestamptz | null | |

Indexes:

- index on `team_id`
- index on `user_id`
- index on `status`

### `fields`

Purpose: configurable football fields displayed on the tablet and managed by admin.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| name | text | not null | |
| slug | text | not null, unique | Public/admin route-safe identifier |
| field_type | field_type | not null | `futbol5` or `futbol8` |
| default_checkin_limit | integer | not null | Global limit for new bookings |
| image_url | text | null | Supabase Storage URL/path |
| display_order | integer | not null, default 0 | Tablet ordering |
| is_active | boolean | not null, default true | Logical deletion |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |

Indexes:

- unique index on `slug`
- index on `field_type`
- index on `is_active`
- index on `display_order`

### `system_settings`

Purpose: global operational configuration for bookings and QR windows.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | Single-row pattern for MVP |
| booking_duration_minutes | integer | not null | Global booking duration |
| grace_minutes | integer | not null | Max 30 |
| updated_by_user_id | uuid | not null, fk -> users.id | Admin who changed settings |
| updated_at | timestamptz | not null | |

Rules:

- keep exactly one active row in the MVP
- enforce `grace_minutes <= 30`

### `bookings`

Purpose: concrete scheduled turns for each field.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| field_id | uuid | not null, fk -> fields.id | |
| team_id | uuid | null, fk -> teams.id | Optional association |
| starts_at | timestamptz | not null | |
| ends_at | timestamptz | not null | |
| valid_from | timestamptz | not null | Computed using grace at creation |
| valid_until | timestamptz | not null | Computed using grace at creation |
| qr_token | text | not null, unique | Unique token rendered in QR |
| checkin_limit_snapshot | integer | not null | Snapshot from field at booking creation |
| status | booking_status | not null, default `scheduled` | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |

Indexes:

- unique index on `qr_token`
- index on `field_id`
- index on `team_id`
- index on `starts_at`
- index on `status`

Rules:

- no overlapping bookings on the same field
- `starts_at < ends_at`

Implementation note:

- overlap prevention can be enforced with an exclusion constraint using range types or with transactional validation if you want to keep the schema simpler initially

### `checkins`

Purpose: immutable arrival records tied to a booking.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| booking_id | uuid | not null, fk -> bookings.id | |
| user_id | uuid | not null, fk -> users.id | |
| field_id | uuid | not null, fk -> fields.id | Denormalized for easier exports |
| checked_in_at | timestamptz | not null | |
| created_at | timestamptz | not null | |

Indexes:

- unique composite index on `(booking_id, user_id)`
- index on `field_id`
- index on `checked_in_at`

### `score_adjustments`

Purpose: manual score changes performed by admins.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| user_id | uuid | not null, fk -> users.id | Affected user |
| admin_user_id | uuid | not null, fk -> users.id | Acting admin |
| score_type | score_type | not null | Which score bucket changed |
| delta | integer | not null | Positive or negative |
| reason | text | not null | Human-readable rationale |
| created_at | timestamptz | not null | |

Indexes:

- index on `user_id`
- index on `admin_user_id`
- index on `score_type`

### `redemptions`

Purpose: score spending events for promotions/benefits.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| user_id | uuid | not null, fk -> users.id | |
| admin_user_id | uuid | not null, fk -> users.id | Admin who registered redemption |
| points_spent | integer | not null | Must reduce `score_vigente` |
| description | text | not null | Benefit/promo description |
| created_at | timestamptz | not null | |

Indexes:

- index on `user_id`
- index on `admin_user_id`
- index on `created_at`

### `email_notifications`

Purpose: operational log for reminder emails.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| team_id | uuid | null, fk -> teams.id | |
| booking_id | uuid | null, fk -> bookings.id | |
| recipient_email | text | not null | |
| template_type | text | not null | |
| status | text | not null | Pending/sent/failed style values |
| provider_message_id | text | null | Resend response reference |
| created_at | timestamptz | not null | |

Indexes:

- index on `team_id`
- index on `booking_id`
- index on `status`

### `admin_audit_logs`

Purpose: minimum admin audit trail for sensitive actions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | pk | |
| admin_user_id | uuid | not null, fk -> users.id | |
| action | text | not null | Example: `score.adjusted`, `field.updated` |
| entity_type | text | not null | Example: `user`, `field`, `booking` |
| entity_id | uuid | not null | Target entity |
| metadata_json | jsonb | null | Structured details |
| created_at | timestamptz | not null | |

Indexes:

- index on `admin_user_id`
- index on `entity_type`
- index on `entity_id`
- index on `created_at`

## Score Update Rules

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

- `score_total -= 1`
- `score_vigente -= 1`
- `score_monthly -= 1` only if the check-in belongs to the current calendar month according to the business timezone rule chosen by the app

## Migrations Order

Recommended initial migration order:

1. enums
2. `users`
3. `teams`, `team_members`, `team_join_requests`
4. `fields`
5. `system_settings`
6. `bookings`
7. `checkins`
8. `score_adjustments`
9. `redemptions`
10. `email_notifications`
11. `admin_audit_logs`

## Initial Seed Data

Recommended seed set:

- 1 admin user
- 2 regular users
- 3 sample fields with images
- 1 system settings row
- 3 sample bookings on one field demonstrating previous/current/next visibility
- 1 sample team with owner
