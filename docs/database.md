# Database

Module 02 uses Supabase PostgreSQL through Prisma. Prisma owns only the
application tables in `packages/database/prisma/schema.prisma`; it does not
manage Supabase internal schemas or Auth tables.

## Connections

`DATABASE_URL` must be the Supabase pooled runtime connection. Web requests
reuse a singleton Prisma client from `@schooz/database`, which avoids creating
a client per request while remaining safe during local hot reloads.

`DIRECT_URL` must be the Supabase direct database connection. Prisma migrations
use it for database administration and deployment. Both values are server-only
and must never be exposed through a `NEXT_PUBLIC_` variable or client bundle.

## Migrations and seed

Create and review migrations from the database package, then deploy committed
migration directories with `pnpm prisma:migrate`. The initial migration is
version controlled and can be applied to an empty database. The development
seed is deterministic and creates only fixed demo records; it refuses to run
when `NODE_ENV=production`. The demo profile is a database skeleton and is not
a Supabase Auth credential.

## Constraints and indexes

Database constraints enforce unique profile email, school slug, and the
`(schoolId, userId)` membership invariant. Foreign keys cascade membership
cleanup when an application-owned school or profile is removed. Indexes cover
school status ordering and membership lookup patterns (`userId,status` and
`schoolId,status`). No index is added without an expected access pattern.

Integration tests are opt-in because they require a development/test database:

```bash
RUN_DATABASE_INTEGRATION=true pnpm test:integration
```
