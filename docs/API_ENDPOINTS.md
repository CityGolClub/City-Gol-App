# City Gol - API Endpoints

## Conventions

- Base path: `/api`
- Auth model: `email + password` with Supabase Auth, app session cookie, app profile in `users`
- Business-rule rejections should return user-friendly messages
- QR check-in flow must preserve redirect context to the original token

## Auth

### `POST /api/auth/register`

Purpose: create Supabase Auth credentials and an app profile.

Request:

```json
{
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan@example.com",
  "phone": "+5491123456789",
  "birthDate": "1995-04-20",
  "password": "CityGol123!",
  "redirect": "/checkin/cur123"
}
```

Success `201`:

```json
{
  "success": true,
  "redirect": "/checkin/cur123",
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

Conflict `409`:

```json
{
  "success": false,
  "message": "Ya existe una cuenta con ese mail o celular"
}
```

### `POST /api/auth/login`

Purpose: sign in with email and password.

Request:

```json
{
  "email": "juan@example.com",
  "password": "CityGol123!",
  "redirect": "/checkin/cur123"
}
```

Success `200`:

```json
{
  "success": true,
  "redirect": "/checkin/cur123",
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

Failure `401`:

```json
{
  "success": false,
  "message": "Credenciales invalidas"
}
```

### `POST /api/auth/logout`

Purpose: clear the app session cookie.

### `GET /api/auth/session`

Purpose: return current authenticated user state.

Authenticated `200`:

```json
{
  "authenticated": true,
  "user": {
    "id": "user_1",
    "firstName": "Juan",
    "lastName": "Perez",
    "email": "juan@example.com",
    "role": "user"
  },
  "panel": {
    "id": "user_1",
    "scores": {
      "total": 22,
      "monthly": 6,
      "vigente": 14
    }
  }
}
```

Unauthenticated `200`:

```json
{
  "authenticated": false
}
```

### `POST /api/auth/forgot-password`

Purpose: send recovery email through Supabase.

Request:

```json
{
  "email": "juan@example.com",
  "redirect": "/checkin/cur123"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Te enviamos un mail para recuperar la contrasena",
  "redirect": "/checkin/cur123"
}
```

### `POST /api/auth/reset-password`

Purpose: update the password using Supabase recovery tokens.

Request:

```json
{
  "accessToken": "token",
  "refreshToken": "token",
  "password": "NuevaClave123!"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Contrasena actualizada"
}
```

## Check-In

### `GET /api/checkin/:token`

Purpose: fetch QR booking state before attempting check-in.

Success `200`:

```json
{
  "booking": {
    "id": "booking_current_1",
    "fieldId": "field_1",
    "fieldName": "Cancha 1",
    "fieldType": "futbol5",
    "startsAt": "2026-06-07T18:00:00.000Z",
    "endsAt": "2026-06-07T19:00:00.000Z",
    "validFrom": "2026-06-07T17:30:00.000Z",
    "validUntil": "2026-06-07T19:30:00.000Z",
    "qrToken": "cur123",
    "checkinLimit": 10,
    "checkinsUsed": 7,
    "isFull": false,
    "isAvailable": true,
    "status": "scheduled",
    "message": null
  },
  "viewer": {
    "authenticated": true,
    "alreadyCheckedIn": false
  }
}
```

### `POST /api/checkin/confirm`

Purpose: confirm check-in for the authenticated user.

Auth: required.

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
  "showConfirmationModal": true,
  "booking": {
    "id": "booking_current_1",
    "fieldName": "Cancha 1",
    "startsAt": "2026-06-07T18:00:00.000Z",
    "endsAt": "2026-06-07T19:00:00.000Z"
  },
  "scores": {
    "total": 23,
    "monthly": 7,
    "vigente": 15
  },
  "panelSummary": {
    "user": {
      "id": "user_1",
      "firstName": "Juan",
      "lastName": "Perez"
    },
    "team": {
      "id": "team_1",
      "name": "Los Pibes",
      "isOwner": true
    },
    "scores": {
      "total": 23,
      "monthly": 7,
      "vigente": 15
    }
  },
  "panel": {
    "id": "user_1",
    "firstName": "Juan",
    "lastName": "Perez"
  }
}
```

Business rejection examples:

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

```json
{
  "success": false,
  "message": "Necesitas iniciar sesion para hacer check-in"
}
```

## User Panel

### `GET /api/users/me`

Purpose: fetch full panel payload for the authenticated app user.

Auth: required.

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

## Public Fields and QR Panel

### `GET /api/fields`

Purpose: list active fields for the tablet selector.

### `GET /api/fields/:id/qr-panel`

Purpose: return all bookings currently visible for one field.

Current behavior:

- DB-backed
- calculates `visibleBookings[]` from active bookings whose valid window contains `now`
- includes live `checkinsUsed`, `isFull`, `isAvailable`, and `displayKind`

## Remaining Planned Endpoints

The following remain part of the intended API surface but are not all implemented yet:

- `PATCH /api/users/me`
- team management endpoints
- admin users endpoints
- admin fields endpoints
- admin settings endpoints
- admin bookings endpoints
- admin redemptions endpoints
- xlsx export endpoint
- reminder job endpoints
