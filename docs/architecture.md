# Architecture

Schooz is a modular monolith. The web application and a future worker will
share a repository and package boundaries; they are separate processes only
when background work is introduced.

## Current foundation

The root package is the initial web application. Future workspace packages are
reserved for database access, domain services, validation, shared utilities,
and configuration. Module 01 intentionally contains no database schema,
authentication, authorization, queues, workers, or business modules.

## Request direction

Reads and page composition belong in Server Components. Client Components are
reserved for real browser interactivity. Mutations will use a route handler or
server action that validates input, authenticates the caller, authorizes the
operation, and delegates to a service. Services will call repositories or
other data-access modules; React components must not contain business logic.

## Server-only boundaries

Modules that can access secrets, databases, or privileged integrations import
`server-only`. They must not be imported by Client Components. Public browser
configuration will be exposed only through explicitly named `NEXT_PUBLIC_`
variables.

## Deferred decisions

Supabase Auth, Prisma/PostgreSQL schema, tenant isolation, storage, queues,
worker processing, and school administration are deferred to later modules.
