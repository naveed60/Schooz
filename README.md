# Schooz

Production foundation for a multi-tenant school management SaaS.

## Prerequisites

- Node.js 22+
- pnpm 10+
- Supabase project with PostgreSQL

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:generate
pnpm dev
```

The database package owns only application tables and does not manage Supabase
Auth tables. Set `DATABASE_URL` to the Supabase pooled runtime connection and
`DIRECT_URL` to the direct migration connection, then run:

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm prisma:migrate
pnpm db:seed
```

Database credentials and the optional Supabase service-role key are server-only.
See [docs/database.md](docs/database.md) for the connection and migration
strategy.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
```

See [docs/architecture.md](docs/architecture.md) for the current boundaries and deferred decisions.
See [docs/authentication.md](docs/authentication.md) for the Supabase Auth and profile synchronization contract.
# Schooz
