# Tide Operations

Tide Events Group Scotland's operational platform — client and event
lifecycle, planning, controlled documents, risk and readiness, and the
flagship live incident control room.

This is a ground-up rebuild against a comprehensive technical/product
specification, superseding the previous `tide-operations` codebase. The
prior app (CRM/commercial pipeline, uploaded-document workflow, an earlier
incident control implementation) remains live at its existing deployment
during this rebuild; nothing here has touched it. See `/docs/architecture.md`
for what's being rebuilt and why.

## Stack

Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 + shadcn/ui
(Base UI) · TanStack Query · Supabase (Postgres, Auth, Storage, RLS) ·
Vercel.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.local.example` to `.env.local` and fill in the Supabase
publishable key and service role key from the `tide-operations-system`
Supabase project (`eu-west-2`) — Project Settings → API.

## Documentation

- `/docs/architecture.md` — target architecture, domains, data flow, tenancy
- `/docs/incident-control.md` — flagship Incident Control domain model
- `/docs/data-classification.md` — Public/Client/Internal/Confidential/Restricted scheme

## Status

Early rebuild — foundation phase. See open tasks for current build phase.
