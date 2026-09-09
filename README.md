# Sential Incident Control

Sential is an operational incident-management platform for live events. The MVP is built around one event context, one operational picture, and one auditable incident record.

## Prerequisites

- Node.js 20.9 or later
- Docker-compatible runtime
- Supabase CLI is installed as a project dependency

Docker Desktop, Colima, Rancher Desktop, Podman, or another Docker-compatible runtime can be used. The local Supabase stack requires the runtime to be running before development starts.

## Local setup

1. Install dependencies.

   ```sh
   npm ci
   ```

2. Create local environment configuration.

   ```sh
   cp .env.example .env.local
   ```

3. Start the local Supabase stack.

   ```sh
   npx supabase start
   ```

4. Copy the local publishable and secret keys from the Supabase startup output into `.env.local`. Never commit `.env.local` or a secret key.

5. Start the application.

   ```sh
   npm run dev
   ```

The app is available at `http://localhost:3000`. The health endpoint is `http://localhost:3000/api/health`.

## Verification

Run the same checks used by continuous integration:

```sh
npm run typecheck
npm run lint
npm run test:run
npm run db:verify
npm run smoke
```

`db:verify` starts the local Supabase stack if needed and confirms that every migration is applied. `smoke` produces a production Next.js build.

## Project structure

- `src/app/` — routes and UI shells
- `src/modules/` — domain, application, and data-access modules as they are added
- `supabase/migrations/` — controlled database history
- `scripts/` — local verification helpers
- `.pandaos/` — product specification, architecture decisions, and delivery log

## Security and operational integrity

- Do not put Supabase secret/service keys in `NEXT_PUBLIC_` variables.
- Every operational record will be event-scoped and protected by backend authorisation and Row Level Security.
- Timelines, actions, decisions, and audit history will be append-first. Important records must not silently disappear.
- Scenario data is for development only and must be clearly distinguished from live operational records.
