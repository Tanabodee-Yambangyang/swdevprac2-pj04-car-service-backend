# Car Service Appointment Booking System API

A RESTful backend API for browsing car service packages and booking vehicle service appointments. It supports user authentication, role-based access control, service package administration, and appointment booking rules.

## Features

### Authentication and Users

- Register and log in with email and password
- Password hashing with bcryptjs
- JWT bearer-token authentication through the Authorization header
- Roles: `admin` and `member`
- Protected routes and role-based authorization
- Registration accepts either role, following PJ01-SportFacility, PJ02-EquipmentRent, and PJ03-WorkshopRegist
- Registration and login return `data.token` and set an HTTP-only cookie; authentication middleware reads the bearer header only
- Logout clears the cookie; clients must discard their bearer token, which remains valid until expiration

### Service Packages

- Public service package listing and detail endpoints
- Admin-only create, update, and delete operations
- Fields: name, description, estimated duration in minutes, and service fee
- Estimated duration must be a positive integer; service fee must be a nonnegative number
- New packages receive a MongoDB `_id` for subsequent updates, deletion, and appointment creation
- Package names may repeat
- Deletion is a soft delete (`isActive=false`); existing appointments remain available
- Editing a package's estimated duration does not alter existing appointment intervals

### Appointments

- Members book one active service package by its ID
- Required vehicle fields: registration number, brand, and model
- Required schedule fields: appointment date and start time
- Members can view, edit, and delete their own appointments
- Admins can view, edit, and delete any member's appointments; creation is member-only
- Ownership comes from authentication and cannot be changed through request bodies
- Updates accept the fields being changed; omitted fields retain their current values
- Appointments include populated service and member details, a saved duration, and calculated start/end timestamps
- Deletion permanently removes an appointment and releases its booking slot

### Appointment Rules

- Dates use `YYYY-MM-DD`; times use 24-hour `HH:mm`. Both are interpreted in **UTC**
- The appointment date must be a real calendar date that is today or later in UTC
- The rule checks the date, so an earlier time today is accepted
- A member can have at most one appointment per vehicle per UTC day, even when the times do not overlap
- A vehicle cannot have overlapping appointment intervals across any members or service packages
- Overlap is checked using `[startsAt, endsAt)`; an appointment may start exactly when another ends
- Cross-midnight appointments are supported and checked against next-day bookings
- Each appointment references exactly one active service package
- A member can have at most three future appointments, defined as `startsAt >= current server time`, including appointments later today
- Earlier appointments do not count toward the future limit. Appointments with soft-deleted services still count if their start time is in the future
- Create and update enforce the same rules; updates exclude their own record and check the original owner's limit, including admin updates
- The service duration is saved as `durationMinutes` when booking. Updating the same service retains this duration; changing to another service uses that package's current estimated duration and rechecks conflicts
- Vehicle identity is the normalized registration number: Unicode NFKC normalization, uppercase, and removal of spaces and hyphens. For example, `ab - 1234` becomes `AB1234`. The requirements do not include a province or another vehicle identifier
- Daily uniqueness is per member; different members may book the same vehicle on the same day if the intervals do not overlap
- History remains readable and deletable after the appointment date or package deletion. Editing requires a date today or later and an active service package
- Service and appointment mutations are serialized within one Node.js process. A unique database index on `(user, registrationNumber, appointmentDate)` also protects the daily rule

Overlap and future-count checks assume one backend process. Multiple processes or server instances require database-level transaction/locking coordination to enforce these checks across instances. The current requirements do not specify opening hours, service bay capacity, approval, or payment workflows.

### Security and Documentation

- Helmet security headers
- CORS support
- Rate limiting: 100 requests per IP per 10 minutes
- HTTP parameter pollution protection
- Swagger/OpenAPI documentation at `/api-docs`
- Health check at `/health` (application status only; does not check database connectivity)

## Technology Stack

- Node.js and Express.js
- MongoDB with Mongoose ODM
- JWT and bcryptjs
- Swagger UI and OpenAPI
- Nodemon for development

Dependency ranges and locked versions match PJ03-WorkshopRegist, including Express `^5.1.0` and Mongoose `^8.24.4`. The project uses the same CommonJS modules, async controllers, authentication middleware, Mongoose models, mutation serialization, and response conventions as the existing projects.

## Project Structure

```text
config/          Environment and database configuration
controllers/     Request handlers and business rules
middleware/      Authentication, authorization, and mutation serialization
models/          Mongoose schemas and appointment indexes
routes/          Express API routes and Swagger documentation
server.js        Application entry point
2026-PJ04.md     Thai (English) project and API documentation
```

## Setup

1. From `PJ04-CarServiceAppoint`, install the locked dependencies:

   ```bash
   npm ci
   ```

2. Set `MONGO_URI` in `config/config.env` to your MongoDB connection string. It is intentionally blank initially. Set your own `JWT_SECRET` before deploying; the included value is generated for local development.

   ```dotenv
   NODE_ENV=development
   PORT=5000
   MONGO_URI=
   JWT_SECRET=<your-secret>
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   FRONTEND_URL=http://localhost:3000
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

Use `npm start` to run without Nodemon. The API runs on `http://localhost:5000` by default. Change `PORT` if another project already uses port 5000. With `MONGO_URI` blank, welcome, Swagger UI, and health endpoints work; database-backed APIs require a configured connection. Allow Mongoose to create the appointment uniqueness index when connecting to a new database.

## API Routes

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/auth/me` | Member or admin |
| GET | `/api/v1/auth/logout` | Member or admin |
| GET | `/api/v1/services` | Public |
| GET | `/api/v1/services/:id` | Public |
| POST | `/api/v1/services` | Admin |
| PUT | `/api/v1/services/:id` | Admin |
| DELETE | `/api/v1/services/:id` | Admin |
| GET | `/api/v1/appointments` | Member sees own; admin sees all |
| GET | `/api/v1/appointments/:id` | Owner or admin |
| POST | `/api/v1/appointments` | Member |
| PUT | `/api/v1/appointments/:id` | Owner or admin |
| DELETE | `/api/v1/appointments/:id` | Owner or admin |

The 14 application endpoints are supplemented by `GET /`, `GET /health`, and `GET /api-docs`. Swagger documents all 17 operations.

Successful responses use `{ success: true, data }`, with `count` for lists. Registration and login return the JWT in `data.token`. Creation returns 201; other successful application operations return 200. Errors use `{ success: false, error }`: explicit input validation returns 400, missing/invalid authentication 401, forbidden access 403, missing resources 404, booking conflicts 409, and rate limiting 429. As in the existing projects, other unhandled Mongoose validation/cast errors reach the global error handler and default to 500. Appointment duplicate-key errors are handled as 409.

### Service Package Request Example

`POST /api/v1/services` with an admin token:

```json
{
  "name": "Oil change",
  "description": "Engine oil and filter replacement",
  "estimatedDuration": 60,
  "serviceFee": 500
}
```

### Appointment Request Example

`POST /api/v1/appointments` with a member token:

```json
{
  "service": "<service MongoDB ID>",
  "registrationNumber": "AB-1234",
  "brand": "Toyota",
  "model": "Yaris",
  "appointmentDate": "2026-12-01",
  "startTime": "09:00"
}
```

Replace the service placeholder with `_id` from the service package response. Use a date that is today or later when trying this example. For a 60-minute service, this creates the interval `09:00–10:00 UTC`. A frontend that displays local time must convert it to UTC before sending both date and time, accounting for date changes.

To reschedule, use `PUT /api/v1/appointments/:id`:

```json
{
  "appointmentDate": "2026-12-02",
  "startTime": "10:30"
}
```

Send `Authorization: Bearer <JWT>` with protected requests. In Swagger, click **Authorize** and paste `data.token` without the `Bearer ` prefix. To try the full workflow, register an admin and a member, create a package as admin, then book and manage an appointment as member.

## Checks

```bash
npm test
```

`npm test` performs the same entry-point syntax check as the existing projects. Development verification passed 18 scenarios using real HTTP routes, controllers, middleware, JWT/password methods, and schemas with in-memory persistence, including ownership, booking conflicts, updates, deletion, and concurrent requests. It did not connect to MongoDB. Use Swagger UI against a test MongoDB database after configuring `MONGO_URI` to verify database integration.

