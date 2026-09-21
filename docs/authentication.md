# Authentication

Module 03 uses Supabase Auth with the `@supabase/ssr` cookie-based pattern for
Next.js App Router. Browser code receives only the public Supabase URL and anon
key. No service-role key is used by the authentication flow, and no password,
token, or session secret is stored in Prisma.

## Profile synchronization

`UserProfile.id` is the Supabase Auth user UUID. On registration with an
immediate session, and on the first verified callback/session, the server
upserts the profile using that UUID and a narrow select. Email is normalized by
trimming and lowercasing before writing. Supabase Auth remains the source of
truth for account identity and email uniqueness; the application profile also
has a unique normalized email constraint as a defensive consistency check.

Unverified signups are represented as `INVITED`; a verified authenticated
session changes the profile to `ACTIVE`. The upsert is idempotent and safe to
repeat for a session refresh or callback retry.

## Redirects and protection

Auth redirects accept only same-origin relative paths. External and
protocol-relative values fall back to `/platform`, preventing open redirects.
Middleware refreshes the Supabase session and redirects unauthenticated users
away from `/platform`. This is authentication protection only; platform roles,
school memberships, and tenant authorization are deferred.

## Local configuration

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and an
`APP_URL` matching the Supabase Auth redirect allowlist. The callback endpoint
is `/auth/callback`. Enable email confirmation in the Supabase project for the
verified-account policy used by this module.
