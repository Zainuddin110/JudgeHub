# ADR 0001: Monorepo Architecture and Core Technology Stack

## Context
JudgeHub must be a fully configurable judging platform supporting diverse evaluation events (hackathons, talent shows, grant reviews) without code modifications. It requires a clear separation between pure calculation logic (scoring), schema definitions, access policy, database models, and web applications.

## Decision
1. **Monorepo Architecture (pnpm workspace):**
   - packages/schemas: Zod schemas as the single source of truth for config, validation, and APIs.
   - packages/scoring: Pure deterministic scoring package without database or network I/O.
   - packages/registry: Plugin registries for criterion types, scoring methods, form fields, and assignment algorithms.
   - packages/policy: Central RBAC engine (can()) decoupled from framework controllers.
   - packages/db: Drizzle ORM schema with PostgreSQL, migrations, and seed scripts.
   - packages/ui: Shared design system components and dynamic form renderer.
   - apps/web: Next.js App Router (React, Tailwind CSS, API routes).
   - apps/worker: Background task worker (BullMQ).

2. **Database & ORM:**
   - PostgreSQL 16 with JSONB columns for dynamic schemas and extensible event definitions.
   - Drizzle ORM for type-safe database queries and migrations.

3. **Authentication:**
   - Passwordless email OTP / magic link authentication with secure session cookies.

4. **Auditability:**
   - Cryptographic SHA-256 hash chaining on all audit log records to detect any tampering or record deletion.

## Status
Accepted.
