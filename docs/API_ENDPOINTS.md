# City Gol - API Endpoints

## Conventions

- Base path: `/api`
- Auth style in MVP: session established from `email + phone` login
- Response format should prefer stable JSON shapes and user-friendly business messages
- Business-rule rejections should not surface as raw technical failures in the UI

## Auth

### `POST /api/auth/login`

Purpose: start a user session with low-friction MVP auth.

Request:

```json
{
  "email": "juan@example.com",
  "phone": "+5491123456789"
}
```

Success `200`:

```json
{
  "success": true,
  "user": {
    "id": "user_1",
    "firstName": "Juan",
    "lastName": "Perez",
    "email": "juan@example.com",
    "phone": "+5491123456789",
    "role": "user"
  }
}
```

User-facing rejection `401`:

```json
{
  "success": false,
  "message": "No encontramos una cuenta con esos datos"
}
```

Notes:

- this auth strategy is temporary MVP behavior
- future versions are expected to replace it with stronger verification

### `POST /api/auth/logout`

Purpose: clear current session.

Success `200`:

```json
{
  "success": true
}
```

### `GET /api/auth/session`

Purpose: return current authenticated user and role.

Success `200`:

```json
{
  "authenticated": true,
  "user": {
    "id": "user_1",
    "firstName": "Juan",
    "lastName": "Perez",
    "role": "user"
  }
}
```

Unauthenticated `200`:

```json
{
  "authenticated": false
}
```

## Public Fields and QR Panel

### `GET /api/fields`

Purpose: list active fields for the tablet selector.

Success `200`:

```json
[
  {
    "id": "field_1",
    "name": "Cancha 1",
    "slug": "cancha-1",
    "fieldType": "futbol5",
    "defaultCheckinLimit": 10,
    "imageUrl": "https://.../field-1.jpg",
    "displayOrder": 1
  }
]
```

### `GET /api/fields/:id/qr-panel`

Purpose: return all bookings currently visible for one field.

Success `200`:

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

Errors:

- `404` field not found

## User Panel

### `GET /api/users/me`

Purpose: fetch current user profile and score state.

Success `200`:

```json
{
  "id": "user_1",
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan@example.com",
  "phone": "+5491123456789",
  "birthDate": "1995-04-20",
  "role": "user",
  "team": {
    "id": "team_1",
    "name": "Los Pibes",
    "isOwner": true
  },
  "scores": {
    "total": 22,
    "monthly": 6,
    "vigente": 14
  }
}
```

### `PATCH /api/users/me`

Purpose: update editable profile fields.

Request:

```json
{
  "firstName": "Juan",
  "lastName": "Perez",
  "phone": "+5491123456789",
  "birthDate": "1995-04-20"
}
```

Success `200`:

```json
{
  "success": true
}
```

## Teams

### `POST /api/teams`

Purpose: create a team owned by the current user.

Request:

```json
{
  "name": "Los Pibes"
}
```

Success `201`:

```json
{
  "id": "team_1",
  "name": "Los Pibes",
  "ownerUserId": "user_1"
}
```

### `GET /api/teams/search?q=`

Purpose: search active teams.

Success `200`:

```json
[
  {
    "id": "team_1",
    "name": "Los Pibes",
    "ownerName": "Juan Perez",
    "memberCount": 8
  }
]
```

### `POST /api/teams/:id/join-request`

Purpose: request access to a team.

Success `201`:

```json
{
  "success": true,
  "message": "Solicitud enviada"
}
```

### `GET /api/teams/:id/join-requests`

Purpose: owner/admin view of pending requests.

### `POST /api/teams/:id/join-requests/:requestId/accept`

Purpose: owner accepts a join request.

### `POST /api/teams/:id/join-requests/:requestId/reject`

Purpose: owner rejects a join request.

### `POST /api/teams/:id/transfer-ownership`

Purpose: transfer team ownership to another active member.

Request:

```json
{
  "newOwnerUserId": "user_2"
}
```

### `POST /api/teams/:id/leave`

Purpose: leave current team.

User-facing rejection `409` example:

```json
{
  "success": false,
  "message": "Primero transferi la titularidad del equipo"
}
```

### `DELETE /api/teams/:id`

Purpose: logically delete a team.

## Check-Ins

### `POST /api/checkins/by-token`

Purpose: validate QR and create a check-in.

Request:

```json
{
  "qrToken": "cur123"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Check-in confirmado",
  "scores": {
    "total": 22,
    "monthly": 6,
    "vigente": 14
  }
}
```

Business rejection `409` examples:

```json
{
  "success": false,
  "message": "Ya registramos tu llegada para este turno"
}
```

```json
{
  "success": false,
  "message": "Este turno ya alcanzo el maximo de check-ins"
}
```

```json
{
  "success": false,
  "message": "Este QR no esta disponible en este momento"
}
```

### `GET /api/checkins/me`

Purpose: list authenticated user's check-ins.

## Admin Users

### `GET /api/admin/users`

Purpose: list users with filters.

Supported query parameters:

- `q`
- `teamId`
- `scoreTotalGt`
- `scoreTotalLt`
- `scoreMonthlyGt`
- `scoreMonthlyLt`
- `scoreVigenteGt`
- `scoreVigenteLt`

Success `200`:

```json
{
  "items": [
    {
      "id": "user_1",
      "firstName": "Juan",
      "lastName": "Perez",
      "email": "juan@example.com",
      "phone": "+5491123456789",
      "teamName": "Los Pibes",
      "scores": {
        "total": 22,
        "monthly": 6,
        "vigente": 14
      }
    }
  ],
  "total": 1
}
```

### `PATCH /api/admin/users/:id`

Purpose: edit user profile fields and activation state.

### `POST /api/admin/users/:id/score-adjustments`

Purpose: apply manual score changes.

Request:

```json
{
  "scoreType": "vigente",
  "delta": -3,
  "reason": "Correccion manual"
}
```

Success `201`:

```json
{
  "success": true
}
```

## Admin Redemptions

### `POST /api/admin/redemptions`

Purpose: spend redeemable score.

Request:

```json
{
  "userId": "user_1",
  "pointsSpent": 10,
  "description": "Promo 2x1"
}
```

Success `201`:

```json
{
  "success": true,
  "remainingVigente": 4
}
```

### `GET /api/admin/redemptions`

Purpose: list redemption history.

## Admin Fields

### `GET /api/admin/fields`

Purpose: list fields for administration.

### `POST /api/admin/fields`

Purpose: create field.

Request:

```json
{
  "name": "Cancha 1",
  "slug": "cancha-1",
  "fieldType": "futbol5",
  "defaultCheckinLimit": 10,
  "imageUrl": "https://.../field-1.jpg",
  "displayOrder": 1,
  "isActive": true
}
```

### `PATCH /api/admin/fields/:id`

Purpose: update field metadata.

### `DELETE /api/admin/fields/:id`

Purpose: logical deletion/deactivation.

## Admin Settings

### `GET /api/admin/settings`

Purpose: fetch global system settings.

Success `200`:

```json
{
  "bookingDurationMinutes": 60,
  "graceMinutes": 15
}
```

### `PATCH /api/admin/settings`

Purpose: update booking duration and grace.

Request:

```json
{
  "bookingDurationMinutes": 60,
  "graceMinutes": 20
}
```

Validation notes:

- `graceMinutes` must be `<= 30`
- changes apply only to new bookings

## Admin Bookings

### `GET /api/admin/bookings`

Purpose: list bookings for administration.

Suggested filters:

- `fieldId`
- `teamId`
- `from`
- `to`
- `status`

### `POST /api/admin/bookings`

Purpose: create a booking.

Request:

```json
{
  "fieldId": "field_1",
  "teamId": "team_1",
  "startsAt": "2026-06-06T18:00:00.000Z"
}
```

Server behavior:

- derive `endsAt` using current `bookingDurationMinutes`
- derive `validFrom` and `validUntil` using current `graceMinutes`
- copy field limit into `checkinLimitSnapshot`
- reject overlap on same field

### `PATCH /api/admin/bookings/:id`

Purpose: update a booking.

### `DELETE /api/admin/bookings/:id`

Purpose: cancel or logically remove a booking.

## Admin Check-Ins

### `DELETE /api/admin/checkins/:id`

Purpose: delete an invalid check-in and reverse score impact.

Success `200`:

```json
{
  "success": true
}
```

## Exports

### `GET /api/admin/exports/checkins.xlsx?from=&to=&fieldId=&teamId=`

Purpose: export check-in data to Excel.

Suggested exported columns:

- check-in date
- user full name
- email
- phone
- team name
- field name
- booking range
- score total
- score monthly
- score vigente

## Notifications

### `POST /api/jobs/send-reminders`

Purpose: trigger reminder sending job.

Behavior:

- locate upcoming bookings with associated team
- collect team member emails
- send through Resend
- log results in `email_notifications`

### `GET /api/admin/notifications/logs`

Purpose: inspect email notification history.
