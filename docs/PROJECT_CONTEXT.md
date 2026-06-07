# City Gol - Project Context

## Objective

City Gol is a web application for player check-in at football fields.
Users scan a QR code associated with a scheduled booking, authenticate, and confirm their arrival. Each valid check-in increases the user's score.

This document centralizes the functional scope, business rules, and product decisions so any coding AI or team member can quickly understand the project.

## Main Flow

1. A tablet located at City Gol displays the QR panel.
2. The first screen shows all available fields.
3. The operator selects one field.
4. The app shows every QR currently visible for that field.
5. A player scans the QR code.
6. If the player is not authenticated, they go through the login flow.
7. After authentication, the backend attempts the check-in.
8. If the check-in is valid, it is recorded, the user's score is updated, and the user is redirected to their panel.

## Authentication

The MVP login flow uses:

- email
- phone number

Current decisions:

- both email and phone are required for login
- email must be unique
- phone is required
- the login must feel low-friction for casual users
- the frontend may help with autofill on later visits
- there is no password in the current MVP flow

Known technical debt:

- `email + phone` alone is not a strong authentication method
- a future version is expected to add phone-based verification with automatic capture to reduce operational friction

## Registration and User Data

The auth/profile form must include these fields:

- first name
- last name
- email
- phone
- birth date

Current decisions:

- there must be no profile image upload anywhere in the app
- no avatar or user photo storage for now
- the user profile may later show promotions or business information

## User Panel

Each user has:

- personal information
- score totals
- check-in history
- team-related actions

From the user panel, the user can:

- edit their profile information
- create a team
- browse/search teams
- request to join a team

## Teams

Rules for teams:

- a team has an owner
- the owner is the user who created the team
- a user can belong to only one active team
- the owner can accept or reject join requests
- the owner can transfer ownership to another active member
- the owner can leave only after transferring ownership, unless they delete the team as the only member
- the booking may be associated with a team or may have no team at all
- check-in is currently free and does not depend on belonging to the booking's team

## Fields

Fields are managed from the admin panel.

Each field must have:

- name
- field type: `futbol5` or `futbol8`
- global default check-in limit
- image
- active/inactive state
- display order

Important decisions:

- the global check-in limit is configured at field level
- field images are allowed
- images should live in Supabase Storage and the database should store their URL/path
- there is no per-booking manual override for the check-in limit
- deleting a field should not remove historical data
- logical deletion or deactivation is preferred over destructive deletion

## System Settings

The following settings are global to the system and managed by admin:

- booking duration in minutes
- grace minutes for QR visibility and validity

Rules:

- grace minutes have a maximum of `30`
- changes apply only to new bookings

## Bookings

Each booking:

- belongs to a field
- has a start and end time
- may optionally be associated with a team
- generates its own QR token
- stores a snapshot of the field's check-in limit at creation time
- stores a snapshot of the system duration/grace behavior through its computed validity window

Rules:

- two bookings cannot overlap on the same field
- the snapshot is required so historical bookings remain consistent even if field limits or global settings change later

## QR Rules

The QR does not rotate continuously.
It is regenerated once per booking.

Rules:

- each booking has a unique QR token
- the QR points to a check-in URL associated with that token
- the QR is valid from `grace_minutes` before booking start
- the QR remains valid until `grace_minutes` after booking end
- because grace is configurable and can reach `30`, up to 3 QR codes may coexist for one field: previous, current, and next

## Tablet QR Panel

### Screen 1: Field Selector

The tablet must show all fields as selectable cards.
Each card may show field image, name, and type.
The operator chooses one field and enters the QR screen for that field.

### Screen 2: QR Screen

The selected field view must show:

- back button
- selected field name
- every visible booking for the current moment
- booking QR
- current usage counter: `used / limit`
- status: available, full, closed, etc.

The backend should return all visible bookings in that moment rather than a fixed pair of `current + next`.
The frontend can decide how to lay them out.

## Check-In Rules

A valid check-in must satisfy all of these conditions:

- the QR token exists
- the booking is inside its valid time window
- the booking has not reached the maximum allowed check-ins
- the user has not already checked in for the same booking

If valid:

- create the check-in record
- increment score values accordingly

If invalid:

- return a clear user-facing message
- do not show technical errors to the user when it is a business-rule rejection

Examples of rejection reasons:

- QR not found
- booking outside allowed time window
- booking already full
- user already checked in for that booking

Examples of user-facing messages:

- `Ya registramos tu llegada para este turno`
- `Este turno ya alcanzo el maximo de check-ins`
- `Este QR no esta disponible en este momento`

## Check-In Limits

The maximum number of check-ins is controlled globally by field settings.

Important decisions:

- admin defines the global limit at field level
- that value applies to new bookings
- each booking stores its own `checkin_limit_snapshot`
- the UI must keep showing the QR even when the booking is full
- the backend must block any additional check-ins after the limit is reached

## Score

The system must track three score values:

- `score_total`: historical accumulated score
- `score_monthly`: score accumulated in the current calendar month
- `score_vigente`: currently redeemable score

Score rules:

- each valid check-in adds `+1` to all three scores
- admin can add or subtract score manually
- manual adjustments must be tracked in history
- redemptions consume only `score_vigente`
- `score_total` is never reduced by redemption
- deleting a check-in must reverse score effects accordingly

## Redemptions

Admin can register score redemptions.

Rules:

- a redemption subtracts points from `score_vigente`
- redemptions must be logged historically
- redemptions should remain separate from manual score adjustments

## Admin Panel

The admin panel must support:

- admin authentication
- user listing
- search by name, email, or team
- filters by `score_total`, `score_monthly`, and `score_vigente` with `greater than` or `less than` conditions
- user profile editing
- score adjustment (add or subtract)
- redemption registration
- field creation, editing, image management, and deactivation/deletion
- field parameter management: type and global check-in limit
- global system settings for booking duration and grace minutes
- booking creation, editing, and deletion
- booking monitoring with occupancy and state
- check-in export to `xlsx` by date range

## Notifications

Reminder emails are sent to all emails of the team associated with the booking, when a team exists.

Current decision:

- use Resend for email delivery
- if a booking has no team, no reminder is sent for now

## Current Scope Decisions

These are explicitly in scope:

- login with email and phone
- user panel with editable info
- score system with total, monthly, and vigente values
- team creation and join requests
- owner approval and transfer workflow
- admin panel for users, fields, settings, bookings, score, redemptions, and exports
- tablet QR panel per selected field
- QR validity window with configurable grace period
- booking-level QR token regeneration per booking
- field image upload

## Explicitly Out of Scope for Now

- profile images
- user photo storage
- forcing team membership for check-in
- per-booking custom check-in limit override
- continuous QR rotation during a booking
- strong phone/email verification in the MVP login flow

## Product Summary

City Gol is a check-in app centered around these concepts:

- users authenticate with low friction and keep multiple score values
- teams are optional social/business grouping
- fields define booking capacity behavior
- system settings define booking duration and QR grace windows globally
- each booking owns its own QR token
- the tablet UI is a controlled field-by-field QR display
- the admin panel manages users, fields, settings, bookings, score, redemptions, and exports
