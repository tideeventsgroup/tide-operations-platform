# SENTINEL

Event Incident Management Platform for Tide Events Group Scotland — live
incident control and intelligence at the core, with client and event
lifecycle, planning, controlled documents, and risk and readiness as
supporting modules.

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

The project's default (non-custom-SMTP) email sender has a low send rate
limit that repeated `/request-access` signups during testing will hit
("email rate limit exceeded", and the account is *not* created when this
happens — it's not just the email that fails). To create a test account
without sending any email, insert directly — both `auth.users` **and** a
matching `auth.identities` row are required for password sign-in to work;
`auth.users` alone 404s on sign-in with "Incorrect email or password":
```sql
do $$
declare v_user_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    'you@example.com', crypt('yourpassword', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    false, '', '', '', '', ''
  );
  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id::text, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'you@example.com', 'email_verified', true),
    'email', now(), now(), now()
  );
end $$;
```
(`email` on `auth.identities` is a generated column — don't include it in
the insert list.) Then run the bootstrap-admin steps above against the new
account as normal.

## Documentation

- `/docs/architecture.md` — target architecture, domains, data flow, tenancy
- `/docs/incident-control.md` — flagship Incident Control domain model
- `/docs/data-classification.md` — Public/Client/Internal/Confidential/Restricted scheme

## Status

All 12 build phases are live: foundation (orgs/roles/RLS), clients &
events, Incident Control (the flagship module), operational coordination
(actions/decisions/resources), Flagship Control (duty roster, M/ETHANE,
Major Incident Mode, wallboard), the mobile field PWA with offline
incident queueing, external agency liaison, Document Studio (versioned
documents with an approval workflow), planning & risk (risk register,
readiness checklist), the Client Portal, post-event reporting, and a
hardening pass (RLS/permission audit — see `docs/architecture.md`'s
standing rules on function grants and admin permission backfill, both
added after real bugs found during that audit).
