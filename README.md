# Nbryo — Cattlytics IVF

Monorepo implementing the **User Authentication**, **Signup (invitation)** and
**Companies CRUD** modules from the Cattlytics IVF functional specification.

```
apps/
  api/   NestJS + TypeORM + Postgres
  web/   Next.js (App Router) + Tailwind
```

## Getting started

```bash
npm install
npm run db:up              # Postgres on localhost:5433 via Docker
npm run migration:run -w @nbryo/api
npm run seed -w @nbryo/api # creates the first admin
npm run dev:api            # http://localhost:4000/api
npm run dev:web            # http://localhost:3000
```

The seeded admin is `admin@nbryo.local` / `ChangeMe123!` (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Change the password after the first
login — everyone else joins by invitation.

Copy `apps/api/.env.example` → `apps/api/.env` and `apps/web/.env.example` →
`apps/web/.env.local` to change any defaults.

## Tests

```bash
npm test            # everything
npm run test:api    # service unit tests (mocked repositories)
npm run test:e2e    # HTTP tests against a real Postgres test database
npm run test:web    # component and validation tests
```

The e2e suite uses `nbryo_test`, which it builds from the entities once per run:

```bash
docker exec nbryo-postgres createdb -U nbryo nbryo_test   # first time only
```

## What is implemented

**Authentication (spec 2.1, 2.3.2)** — login with a case-insensitive, trimmed
email; the spec's exact validation messages; active-account enforcement; logout
that genuinely ends the session; 90-day inactivity expiry; forgot/reset password
with 48-hour single-use links that re-issue themselves when expired; change
password; remembered email address.

**Users & signup (spec 2.5)** — admins invite users, who arrive as `Invited` and
receive a 72-hour invitation link. Claiming it sets a password, flips the account
to `Active` and signs the user straight in. Email uniqueness spans active,
inactive and soft-deleted accounts. Admin is an exclusive role; Field Tech and
Lab Tech combine. Users with history are soft deleted, never purged.

**Companies (spec 2.8)** — full CRUD with case-insensitive unique names, billing
and shipping addresses (shipping mirrors billing while the box is checked),
activate/deactivate, delete guarded against records that reference the company,
and a list with search, status and country filters, name sorting and pagination.

## Design notes

- **Sessions.** The JWT carries a `jti` pointing at a `sessions` row. Logout
  deletes the row, so the old token stops working immediately — a plain stateless
  JWT could not satisfy spec 2.1.2. Each authenticated request refreshes
  `lastSeenAt`, which drives the 90-day inactivity expiry.
- **One-time links.** Only a SHA-256 hash of each invitation/reset token is
  stored, and issuing a new one invalidates every outstanding token of that type.
- **Configurable expiries.** Session, reset-link and invitation lifetimes are all
  environment variables; the MVP values from the spec are the defaults.
- **Deleting a company.** `CompaniesService` consults a list of
  `CompanyUsageChecker`s. It is empty today; modules added later (Locations,
  Animals, …) register one instead of the service learning about them.
- **Audit fields.** Every record carries added/updated by and date, stored in UTC
  and formatted only for display.

## Not in scope

Labs (so the lab assignment on a user is omitted), the permission matrix beyond
role checks on user administration, preferences, merge companies, and the
country/state/city reference dataset — the address dropdowns are type-ahead text
inputs that store the same values. Email is written to the application log by
`ConsoleMailService`; swap that provider for a real transport in production.
