# City Gol - Project Context

## Objective

City Gol is a web application for player check-in at football fields.
Players scan a booking QR, authenticate with email and password, confirm their arrival, and then land in their user panel. Each valid check-in increases the user's score.

This document centralizes product rules, UX flows, and business decisions so any developer or coding AI can understand the project quickly.

## Main User Flow

1. A player arrives at City Gol.
2. On the tablet, they select a field.
3. The tablet shows every QR currently visible for that field.
4. The player scans the QR that matches their booking.
5. On the phone, the user lands on the check-in flow for that QR token.
6. If the user is not authenticated:
   - they see the login screen
   - or they go to registration
7. If the user logs in or registers successfully, the app returns them to the same QR token flow without requiring a second scan.
8. The app attempts the check-in.
9. If valid, it shows a success popup and the user panel underneath.
10. The popup disappears automatically after a few seconds.

## Authentication

Authentication uses:

- email
- password

Supporting auth flows:

- registration
- login
- logout
- forgot password
- reset password

Decisions:

- phone remains mandatory in registration/profile
- birth date remains mandatory in registration/profile
- password recovery is handled through Supabase Auth email recovery
- the app must preserve `qrToken` across login/registration and return the user to the pending check-in flow

## Registration

Registration requires:

- first name
- last name
- email
- phone
- birth date
- password

Rules:

- email is unique
- phone is required
- the app uses Supabase Auth for credentials
- the app uses its own `users` table for profile and business data

## Password Recovery

Password recovery flow:

1. user opens `forgot password`
2. user enters email
3. Supabase sends recovery email
4. user follows recovery link to the app
5. user sets a new password
6. user returns to login or directly continues if frontend keeps redirect context

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
- a booking may optionally be associated with a team
- check-in is currently free and does not require belonging to the booking's team

## Fields

Fields are managed from the admin panel.

Each field has:

- name
- field type: `futbol5` or `futbol8`
- global default check-in limit
- image
- active/inactive state
- display order

Rules:

- images are allowed for fields
- images live in Supabase Storage and the DB stores the URL/path
- the global check-in limit is configured at field level
- there is no per-booking manual override for the limit
- logical deletion/deactivation is preferred over destructive deletion

## System Settings

Admin manages these global settings:

- booking duration in minutes
- grace minutes for QR visibility and validity

Rules:

- grace minutes max is `30`
- settings changes affect only new bookings

## Bookings and QR

Each booking:

- belongs to a field
- has start/end time
- may optionally belong to a team
- has its own QR token
- stores the check-in limit snapshot used at creation time

QR rules:

- each booking has a unique QR token
- QR validity starts `grace_minutes` before booking start
- QR validity ends `grace_minutes` after booking end
- because grace can be up to `30`, up to 3 QR codes may coexist for one field: previous, current, next

## Tablet QR Panel

### Screen 1: Field Selector

- shows all active fields
- user/operator selects one field

### Screen 2: QR Panel

- shows all bookings currently visible for that field
- each visible booking shows:
  - time range
  - QR
  - used / limit
  - status

The backend returns all visible bookings for the current moment; the frontend decides the layout.

## Check-In Rules

A valid check-in requires:

- valid QR token
- active authenticated session
- booking inside valid time window
- booking not full
- no previous check-in by the same user for that booking

If valid:

- create check-in record
- increment `score_total`
- increment `score_monthly`
- increment `score_vigente`

If invalid:

- return a user-friendly message
- do not show technical failure language for business-rule rejections

Examples:

- `Ya registramos tu llegada para este turno`
- `Este turno ya alcanzo el maximo de check-ins`
- `Este QR no esta disponible en este momento`
- `Necesitas iniciar sesion para hacer check-in`

## Score

The app tracks:

- `score_total`: historical accumulated score
- `score_monthly`: score for current calendar month
- `score_vigente`: currently redeemable score

Rules:

- each valid check-in adds `+1` to all three scores
- admin can add or subtract score manually
- redemptions consume only `score_vigente`
- deleting a check-in must reverse score impact accordingly

## Admin Panel

The admin panel must support:

- admin authentication
- user listing
- search by name, email, or team
- score-based filters for total/monthly/vigente
- user profile editing
- score adjustments
- redemption registration
- field CRUD and image management
- field type and check-in limit management
- global settings management
- booking creation/edit/deletion
- booking occupancy monitoring
- xlsx export by date range

## Notifications

Reminder emails are sent to all emails of the team associated with a booking, when a team exists.

Current decision:

- use Resend for delivery
- if a booking has no team, reminders are skipped for now

## Current Scope Decisions

In scope:

- registration with email/password
- login/logout/session
- password recovery/reset
- QR check-in flow with preserved redirect
- user panel with editable info
- score system with total/monthly/vigente
- team creation and join requests
- owner transfer workflow
- admin panel for users, fields, settings, bookings, score, redemptions, and exports
- tablet QR panel per field
- booking-level QR token regeneration per booking
- field image upload

Out of scope for now:

- profile images
- user photo storage
- forcing team membership for check-in
- per-booking custom check-in limit override
- continuous QR rotation during a booking

## Product Summary

City Gol is a check-in app centered around these concepts:

- users authenticate with email/password and keep multiple score values
- a QR token is preserved across auth and resumed after login/register
- fields define booking capacity behavior
- system settings define booking duration and QR grace windows globally
- each booking owns its own QR token
- the tablet UI is a controlled field-by-field QR display
- the admin panel manages users, fields, settings, bookings, score, redemptions, and exports
