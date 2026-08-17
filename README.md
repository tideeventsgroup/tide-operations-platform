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

### Bootstrapping the first admin

Registration is restricted-by-default: every new account starts as
`account_type = pending` with no role, and only an admin can promote
anyone — including the very first one. There's no "first user becomes
admin" window. To bootstrap:

1. Sign up at `/request-access` (or use an existing `auth.users` row).
2. In the Supabase SQL editor for `tide-operations-system`, promote the
   account. A trigger (`profiles_guard_sensitive_fields`) blocks changing
   `account_type`/`organisation_id`/`status` for anyone who isn't already an
   admin — including this first-run SQL, since no admin exists yet — so
   disable it for the one statement:
   ```sql
   alter table profiles disable trigger profiles_guard_sensitive_fields;
   update profiles
   set account_type = 'staff', organisation_id = (select id from organisations where code = 'TEG')
   where email = 'you@tideeventsgroup.co.uk';
   alter table profiles enable trigger profiles_guard_sensitive_fields;

   insert into user_roles (user_id, role_id, organisation_id)
   select p.id, r.id, p.organisation_id
   from profiles p, roles r
   where p.email = 'you@tideeventsgroup.co.uk' and r.code = 'admin';
   ```
3. Sign in — you'll see the Administration → Users & Roles section, from
   which every subsequent approval happens through the UI.

Supabase Auth requires email confirmation before sign-in by default.
Locally, either disable "Confirm email" under Authentication → Providers →
Email in the Supabase dashboard, or confirm manually:
```sql
update auth.users set email_confirmed_at = now() where email = '...';
```

## Documentation

- `/docs/architecture.md` — target architecture, domains, data flow, tenancy
- `/docs/incident-control.md` — flagship Incident Control domain model
- `/docs/data-classification.md` — Public/Client/Internal/Confidential/Restricted scheme

## Status

Early rebuild — foundation phase. See open tasks for current build phase.
