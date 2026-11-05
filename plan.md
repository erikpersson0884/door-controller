# Implementation Plan: Admin-Managed Expiring Unlock Passwords

**Date**: 2026-11-05 | **Spec**: User request, clarified choices

## Summary

Add an Admin action in the top-right of the door-control page, a separately authenticated `/admin` page, and server-backed management of multiple unlock passwords. Administrators use the `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables. Unlock passwords are separate credentials used on the normal login page, apply to all configured doors, and may expire at a specified date/time or never expire. Passwords are stored as hashes with metadata in SQLite on a mounted Docker volume; plaintext passwords are never persisted or returned by the API.

## Technical Context

**Language/Version**: React 19 + TypeScript 6 client; Node.js 24 + Express 4 server  
**Primary Dependencies**: `react-router-dom`, `express-session`, `dotenv`; add a small SQLite driver and password-hashing utility only if an existing platform/library is not suitable  
**Storage**: SQLite database persisted at a configurable path on a Docker volume  
**Testing**: Vitest/client tests plus focused server API tests; manual/browser acceptance for login, admin CRUD, expiry, and door triggering  
**Target Platform**: Docker Compose deployment behind the existing reverse proxy  
**Performance Goals**: Password lookup should be indexed and complete in one database query; admin list remains responsive for ordinary household/event-sized password sets  
**Constraints**: Preserve the existing session-cookie model and JSON 401 behavior. Do not expose password hashes, plaintext passwords, or secrets to the frontend. Existing door configuration remains environment-based.

## Constitution Check

No repository constitution was found. The plan therefore applies these repository constraints:

- **Authentication integrity — PASS**: retain server-side sessions and protect every admin endpoint with explicit authorization.
- **Secret handling — PASS**: hash unlock passwords, never log or return them, and keep admin credentials/`SESSION_SECRET` environment-managed.
- **Authentication separation — PASS**: administrator sessions manage passwords but do not authenticate door operations; door sessions use only managed unlock passwords.
- **Operational persistence — PASS**: use a mounted SQLite volume and fail clearly if the database cannot be initialized.

## Applied Guidelines

- Use the existing Express `requireAuth` middleware pattern for protected JSON APIs.
- Keep authentication state in the existing `AuthContext`; route authorization belongs in React guards and server middleware.
- Follow the existing `fetch`-based client API style and existing CSS conventions.
- Treat expiry on the server as authoritative; client-side disabled/expired labels are presentation only.

## Implementation Steps

### Step 1: Foundational password data and authentication service
- **Requirements**: REQ-001, REQ-003, REQ-004
- **Design inputs**: Existing `server/server.js` login/session flow; `.env.example`; Dockerfile and Compose configuration.
- **Description**: Add SQLite initialization, schema/migrations, and a password service. Store an id, label/name, password hash, expiry timestamp nullable for never-expiring credentials, created/updated timestamps, and optional disabled/revoked state. Hash with a slow password-hashing algorithm and compare hashes during login. Continue accepting `APP_PASSWORD` as the admin credential, while checking stored unlock passwords for ordinary user login. Define and document exact expiry semantics using UTC timestamps; reject expired/disabled credentials.

### Step 2: Admin authorization and password-management API
- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-004
- **Design inputs**: Existing `requireAuth`, session object, and JSON API conventions in `server/server.js`.
- **Description**: Add an admin session marker when `APP_PASSWORD` succeeds, plus `requireAdmin` middleware. Add protected endpoints to list safe password metadata, create a password, update its label/expiry/status, and revoke/delete it. Return the generated/entered plaintext only in the create response (or require the admin to enter it), never from list/update requests. Validate labels, password length, expiry format, and expiry ordering. Prevent ordinary unlock-password sessions from accessing admin endpoints. Add clear 401/403/400/404 responses and avoid logging credentials.

### Step 3: Login compatibility and authorization behavior
- **Requirements**: REQ-003, REQ-004, REQ-005
- **Design inputs**: Existing `POST /login`, `/auth/check`, `/doors`, and `/trigger/:doorId` endpoints.
- **Description**: Extend login to authenticate either `APP_PASSWORD` (admin) or an active stored unlock password. Mark session role/source so `/admin` is restricted while door routes accept either authenticated role. Preserve the current frontend contract (`{ ok: true }`) and session behavior. Ensure expired/revoked passwords fail with the same non-revealing login error as an incorrect password. Add rate-limit/lockout consideration to the implementation or document it as a follow-up if it is outside this change.

### Step 4: Client routing, top-right Admin action, and admin UI
- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-004
- **Design inputs**: `client/src/App.tsx`, `client/src/auth/Guards.tsx`, `client/src/auth/AuthContext.tsx`, and `client/src/pages/DoorControl.tsx`.
- **Description**: Add `/admin` and an admin-only route guard that checks the server-backed role. Add a top-right Admin button/link to the door page, with responsive styling that does not cover door controls. Build an admin page with a table/list of password records showing label, created date, expiry (`Never` when null), and status, plus create, edit expiry/label, revoke, and delete actions. Display a one-time success state for a newly created password without storing it in local storage. Handle 401/403 by redirecting or showing an explicit authorization message.

### Step 5: Deployment, configuration, and documentation
- **Requirements**: REQ-005, REQ-006
- **Design inputs**: `.env.example`, `docker-compose.yml`, `Dockerfile`, and README deployment instructions.
- **Description**: Add a configurable database path and a named Docker volume mounted at that path. Update environment examples and deployment docs to explain the administrator password, unlock-password lifecycle, backup/restore of the SQLite volume, expiry timezone/format, and the fact that losing the volume loses managed passwords. Document that all active unlock passwords can operate all configured doors.

### Step 6: Verification and security regression coverage
- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006
- **Design inputs**: All changed server/client surfaces.
- **Description**: Add focused tests for schema initialization, hash verification, admin authorization, create/list/update/revoke/delete, never-expiring passwords, expiry boundaries, login role assignment, and non-disclosure of hashes/plaintext. Add client tests for route protection, top-right navigation, form validation, and status rendering. Run build, lint, and test commands, then perform a browser smoke test against the Docker/production-shaped app.

## Project Structure

```text
server/
  server.js                 # route wiring and session role handling
  auth/                     # password hashing and credential service
  db/                       # SQLite initialization/schema/access helpers
  routes/                   # optional extraction for admin/password APIs
client/src/
  App.tsx                  # /admin route
  auth/Guards.tsx           # admin route guard
  pages/Admin.tsx           # password management UI
  pages/DoorControl.tsx     # top-right Admin action
  styles.css                # admin/header/responsive styles
docker-compose.yml          # persistent SQLite volume
.env.example               # database path/configuration
README.md                  # setup and operational documentation
```

## Testing Strategy

- **appType**: mixed SPA + JSON API
- **Critical user journeys**:
  1. Administrator logs in with `ADMIN_USERNAME`/`ADMIN_PASSWORD`, opens Admin from the top-right action, and sees password metadata.
  2. Administrator creates a password with a finite expiry, uses it to log in, and triggers a door.
  3. An expired or revoked password cannot log in, while an active password still can.
  4. An ordinary unlock-password session cannot open `/admin` or call admin APIs.
  5. A never-expiring password remains usable and is displayed as `Never`.
- **primaryValidationStack**: Vitest for client and server-focused tests; TypeScript build and ESLint; browser smoke test with the existing app deployment.
- **fallbackMatrix**:
  - `infra-tier`: Docker Compose with a temporary SQLite volume → direct Node process with a temporary database path. Gap: no reverse-proxy/container persistence validation.
  - `browser-tier`: browser automation/manual smoke test → focused API and component tests. Gap: no visual/navigation integration coverage.
- **Environment requirements**: Node.js/npm; Docker for deployment validation; a disposable test database; no real unlock endpoint for unit tests (mock the outbound request).
- **Test data strategy**: create isolated temporary database files per test suite, use deterministic labels/passwords, and delete temporary files after tests.
- **Acceptance criteria**: every journey above passes; no API response contains a password hash; expired credentials are rejected server-side; existing door controls still work with an authenticated session.
- **Validation review expectations**: verify authorization boundaries, expiry timezone behavior, volume persistence after container restart, and no secret leakage in logs or client state.

## Phase 1: Setup

- [x] T001 [Plan:1.1] Add SQLite database path configuration and a mounted persistent volume in `.env.example` and `docker-compose.yml`.
- [x] T002 [P] [Plan:6.1] Establish focused server test scaffolding and temporary-database setup under `server`.

## Phase 2: Foundational

- [x] T003 [Plan:1.1] Implement SQLite initialization, schema creation, indexes, and lifecycle cleanup under `server/db`.
- [x] T004 [P] [Plan:1.1] Implement password hashing/comparison and credential validation under `server/auth`.

## Phase 3: US1 — Administrator manages unlock passwords

- [x] T005 [US1] [Plan:2.1,2.2] Add separate admin-session authentication and `requireAdmin` middleware in `server/server.js`.
- [x] T006 [US1] [Plan:2.1,2.2] Add admin password list/create/update/revoke/delete endpoints with validation and safe response DTOs in `server/server.js` or extracted route modules.
- [x] T007 [US1] [Plan:4.1] Add `/admin` routing and admin-only guard in `client/src/App.tsx` and `client/src/auth/Guards.tsx`.
- [x] T008 [US1] [Plan:4.1] Implement the password-management page in `client/src/pages/Admin.tsx`, including create, edit, revoke, delete, expiry, and one-time secret display states.
- [x] T009 [US1] [Plan:4.1] Add the top-right Admin action and responsive admin styles in `client/src/pages/DoorControl.tsx` and `client/src/styles.css`.

## Phase 4: US2 — Users log in and unlock doors with active passwords

- [x] T010 [US2] [Plan:3.1] Extend `POST /login` to authenticate `APP_PASSWORD` or active hashed unlock passwords and assign the correct session role.
- [x] T011 [US2] [Plan:3.1] Preserve door API authorization for both authenticated roles while denying admin APIs to unlock-only sessions.
- [ ] T012 [P] [US2] [Plan:6.1] Add server tests for active, expired, never-expiring, revoked, incorrect, and unauthorized credentials.

## Phase 5: Polish and cross-cutting validation

- [x] T013 [P] [Plan:5.1] Update `README.md` with administration, expiry, backup, persistence, and security behavior.
- [ ] T014 [P] [Plan:6.1] Add client tests for navigation, admin guard, CRUD states, validation, and non-disclosure of plaintext after creation.
- [ ] T015 [Plan:6.1] Run client/server build, lint, tests, and Docker smoke validation; fix only regressions introduced by this feature.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|--------|-------------|------------|------------------------|
| REQ-001 | Provide a top-right action that opens an authenticated admin page | 2.1, 4.1 | `client/src/pages/DoorControl.tsx`, `client/src/App.tsx`, `client/src/auth/Guards.tsx` |
| REQ-002 | Allow an administrator to create and manage multiple unlock passwords | 1.1, 2.1, 4.1 | SQLite schema/service, admin API, `client/src/pages/Admin.tsx` |
| REQ-003 | Allow active unlock passwords to log in and operate configured doors | 1.1, 3.1 | Login credential service and existing door endpoints |
| REQ-004 | Support finite expiry and infinite expiry, enforced server-side | 1.1, 2.1, 3.1 | Expiry column/validation, login checks, admin display |
| REQ-005 | Preserve secure session and secret-handling behavior | 1.1, 3.1, 5.1, 6.1 | Hashing, role middleware, session tests, documentation |
| REQ-006 | Persist managed passwords across container restarts | 5.1 | Docker volume, database path, backup/restore documentation |
