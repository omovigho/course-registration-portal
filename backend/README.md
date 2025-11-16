# University Course Management Portal – Express Backend

This backend replaces the previous FastAPI implementation with a Node.js + Express service while preserving the existing API surface. It uses SQLite (via `better-sqlite3`) and JSON Web Tokens for authentication.

## Prerequisites

- Node.js 18 or newer
- npm (ships with Node)
- Optional: create a `.env` file beside this README to override defaults.

## Installation

```bash
npm install
```

## Environment Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8000` | HTTP port for the Express server |
| `DATABASE_URL` | `sqlite:///./db.sqlite3` | SQLite database location (file path or `sqlite:///` URI) |
| `JWT_SECRET` | `change-me-in-production` | Secret key used for signing JWTs |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime in minutes |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | `10080` | Refresh token lifetime in minutes |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed origins |

## Database Setup

Apply migrations (creates tables if they do not exist):

```bash
npm run migrate
```

Seed the database with sample faculties, departments, academic year, and default users:

```bash
npm run seed
```

## Development

Start the server in watch mode:

```bash
npm run dev
```

Start the server without watch mode:

```bash
npm start
```

A health check is available at `GET /health`.

## API Parity

All previous FastAPI endpoints continue to exist with the same paths and response structures:

- `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`
- `GET /users/me`
- `POST /students/profile`
- `POST /faculties`, `GET /faculties`, `PUT /faculties/:id`
- `POST /departments`, `GET /departments`, `PUT /departments/:id`
- `POST /courses`, `GET /courses`, `PUT /courses/:id`, `DELETE /courses/:id`
- `POST /registrations`, `GET /registrations`, `POST /registrations/:id/items`, `DELETE /registrations/items/:itemId`, `POST /registrations/:id/submit`
- `GET /admin/students`, `GET /admin/students/export`
- `POST /admin/users/:id/promote`, `POST /admin/users/:id/demote`

Role-based access control, validation, and CSV export behaviour match the original service.

## Project Structure

```
src/
  app.js              Express app configuration
  server.js           HTTP server bootstrap
  config/             Environment settings
  db/                 SQLite connection + migrations
  middleware/         Authentication and error handlers
  routes/             Route definitions grouped by resource
  services/           Business logic and data access helpers
  utils/              Shared helpers (JWT, CSV, etc.)
  scripts/            CLI utilities (migrate, seed)
```

## Testing

The original Python test suite is no longer applicable. Adopt your preferred JavaScript testing framework (Jest, Vitest, etc.) for future automated checks.
