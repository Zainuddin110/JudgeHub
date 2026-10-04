# Assumptions & Defaults

This document tracks all design assumptions, trade-offs, and defaults chosen throughout development in accordance with Section 21 of the build plan.

## Phase 0: Foundations

1. **Authentication:**
   - Default is passwordless Email OTP / Magic link.
   - For local development and test environments, an in-memory/console OTP dispatch adapter is enabled so developers and automated tests can authenticate without live SMTP credentials.
   - Sessions are signed cryptographic tokens (cookie-based or Bearer tokens).

2. **Database & Storage:**
   - Production / Docker uses PostgreSQL 16 (supporting JSONB and RLS).
   - In-memory / mock repository adapters are available for ultra-fast unit testing of business logic and policy enforcement without requiring a running database server.
   - Docker Compose provides Postgres, Redis, and MinIO for complete local integration.

3. **Policy & Permissions:**
   - Central can(user, action, resource) policy checks against role permissions.
   - Default built-in roles: Platform Super Admin, Organization Owner/Admin, Event Organizer, Head Judge / Panel Chair, Judge, Scorekeeper / Coordinator, Participant / Team Lead, Auditor / Observer, Public / Audience.

4. **Audit Log:**
   - Append-only structure with SHA-256 hash-chaining (prev_hash stored on each record, chaining to the next).
   - verifyAuditChainIntegrity verifies that no record has been tampered with or removed.
