# Course Registration Portal
A full-stack web application for managing student course registration, academic records, and administrative workflows for a university environment. It delivers tailored dashboards for students, lecturers, and administrators, while centralizing authentication, payments, and institutional data.

## Overview
- **Backend:** Express.js API with a modular service layer, JWT authentication, and SQLite data store.
- **Frontend:** React + Vite single-page application styled with Tailwind CSS and custom UI components.
- **Capabilities:** Student onboarding, course catalog browsing, registration basket management, school fee tracking, exports, and role-based dashboards.

## Architecture
- **API layer:** REST endpoints defined in `backend/src/routes` with shared middleware for auth and error handling.
- **Business logic:** Services in `backend/src/services` manage validation, mapping, and persistence through the database layer.
- **Persistence:** SQLite database (`backend/db.sqlite3`) with migration and seed scripts to maintain schema state.
- **Client app:** `frontend/src` contains page-level routes, reusable components, auth context, and hooks for data fetching via Axios.
- **Build tooling:** Vite-powered dev server for the frontend, Node scripts for backend migrations and seeding.

## Key Features
- **Role-based portals:** Dedicated experiences for students, lecturers, and administrators.
- **Student services:** Course catalog browsing, registration basket, registration history, school fee payment tracking, and onboarding flow.
- **Administrative tools:** Manage faculties, departments, courses, academic years, student exports, and fee schedules.
- **Authentication & security:** JWT-based login with protected routes and password hashing.
- **Data operations:** CSV utilities, database migration tooling, and consistent error handling middleware.

## Tech Stack
- **Backend:** Node.js, Express.js, SQLite, JWT, bcrypt.
- **Frontend:** React, Vite, Tailwind CSS.
- **Tooling:** npm scripts, PostCSS, Axios.

## Repository Layout
```
backend/
	src/
		routes/           # REST endpoints per domain
		services/         # Business logic layer
		db/               # Database connection and migrations helpers
		middleware/       # Auth and error handling middleware
		utils/            # Shared helpers (async handler, JWT, CSV, etc.)
	scripts/            # Migration and seeding entry points
	package.json        # Backend dependencies and scripts

frontend/
	src/
		pages/            # Role- and feature-specific views
		components/       # UI building blocks and layout elements
		context/          # Auth context provider
		hooks/            # Custom hooks (e.g., authentication)
		api/              # Axios configuration for API access
		utils/            # Formatters, routes, validators
	package.json        # Frontend dependencies and scripts
```

## Prerequisites
- Node.js 18 or later
- npm 9 or later
- SQLite3 (bundled library is sufficient for local development)

## Initial Setup
```pwsh
# Clone the repository
git clone https://github.com/omovigho/course-registration-portal.git
cd course-registration-portal

# Install dependencies for both applications
cd backend
npm install
cd ../frontend
npm install
```

## Backend Configuration
1. Copy `backend/miracle.txt` or an `.env.example` (if provided) into a new `.env` file and adjust values as needed. Typical settings include:
	 - `PORT` (default 5000)
	 - `JWT_SECRET`
	 - `DB_PATH` (defaults to `db.sqlite3`)
2. Ensure the SQLite database file (`backend/db.sqlite3`) exists. If not, run migrations (see below).

### Database Migrations
```pwsh
cd backend

# Run pending migrations
npm run migrate

# Populate seed data (faculties, departments, demo users, etc.)
npm run seed
```

### Development Server
```pwsh
cd backend
npm run dev
```
The API defaults to `http://localhost:5000`. Middleware ensures unauthenticated routes remain open (e.g., `/api/auth/login`), while protected routes require a valid JWT.

## Frontend Configuration
1. Optionally create `frontend/.env` to override Vite defaults (e.g., `VITE_API_BASE_URL=http://localhost:5000/api`).
2. Tailwind and PostCSS are pre-configured in `frontend/tailwind.config.js` and `frontend/postcss.config.js`.

### Frontend Development Server
```pwsh
cd frontend
npm run dev
```
By default, Vite serves the SPA at `http://localhost:5173` and proxies API calls based on the configured base URL.

## Running Both Apps Concurrently
Use two terminal windows (one in `backend`, one in `frontend`) or a process manager like `npm-run-all` (optional) to start both servers simultaneously.

## Available Scripts
### Backend (`backend/package.json`)
- `npm run dev` – start the Express server with Nodemon (if configured) for hot reload.
- `npm run start` – run the API in production mode.
- `npm run migrate` – apply database migrations.
- `npm run seed` – populate the database with seed data.

### Frontend (`frontend/package.json`)
- `npm run dev` – start the Vite dev server with HMR.
- `npm run build` – generate an optimized production build.
- `npm run preview` – serve the production bundle locally for testing.

## Testing
- Automated tests are not yet implemented. Add Jest/Vitest suites or integration tests as needed.
- Manual validation can be performed by walking through student and admin flows in the browser after running both services.

## Deployment Notes
- **Backend:** Host the Express API on a Node-compatible platform (e.g., Azure App Service, Heroku). Configure environment variables securely and provision a persistent database (upgrade to Postgres or MySQL for production scale).
- **Frontend:** Deploy the Vite build output (`frontend/dist`) to a static host (Netlify, Vercel, Azure Static Web Apps) and ensure the `VITE_API_BASE_URL` points to the live API endpoint.
- **Security:** Rotate JWT secrets and enforce HTTPS in production. Consider rate-limiting and audit logging for admin endpoints.

## Troubleshooting
- **Database Locked:** Stop all processes accessing `db.sqlite3` before rerunning migrations.
- **CORS Errors:** Verify the backend includes the correct origin(s) or configure proxying in the frontend Vite dev server.
- **Invalid Token:** Ensure the frontend stores and forwards JWT tokens from login responses; tokens typically belong in secure storage mechanisms.

## Contributing
1. Fork and clone the repository.
2. Create a feature branch: `git checkout -b feature/my-change`.
3. Commit changes with clear messages.
4. Submit a pull request describing the change, testing steps, and screenshots if applicable.

## License
This project is distributed under the terms of the license contained in `LICENSE`.
