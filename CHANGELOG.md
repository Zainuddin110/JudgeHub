# Changelog

All notable changes to the JudgeHub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 0: Foundations
- Monorepo tooling setup with pnpm workspace, TypeScript strict mode, Vitest.
- Docker Compose configuration for PostgreSQL 16, Redis 7, MinIO.
- GitHub Actions CI workflow for automated type-checking and test verification.
- @judgehub/schemas: Central Zod schemas for users, organizations, roles, auth, audit log.
- @judgehub/policy: Centralized RBAC permission engine with can(user, action, resource) policy checks.
- @judgehub/db: Drizzle ORM schema with PostgreSQL support, built-in seeded roles, and append-only hash-chained audit logging helper (verifyAuditChainIntegrity).
- @judgehub/scoring: Pure deterministic scoring package scaffold with no external I/O.
- @judgehub/registry: Plugin registry interfaces for criterion types, scoring methods, form fields, and assignment strategies.
- @judgehub/ui: Design system tokens, Tailwind setup, shared primitives.
- @judgehub/web: Next.js App Router application with passwordless Email OTP authentication, session management, organization creation, audit log recording & verification endpoint, and i18n scaffolding.
