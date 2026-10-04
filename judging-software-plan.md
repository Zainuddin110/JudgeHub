# Dynamic Judging Platform: Build Specification

> **Purpose:** This document is a complete brief for an AI coding assistant (or a human team) to design and build a fully configurable judging platform. The same software must be able to run a hackathon, a talent show, a science fair, a pitch competition, a debate tournament, an academic paper review, or a hiring panel, with **no code changes**, only configuration.

---

## 0. How to use this document

### 0.1 Kickoff prompt (copy-paste this to your AI first)

```
You are a senior full-stack engineer. Build the product described in the attached
specification. Rules:

1. Work phase by phase using Section 17 (Build Plan). Do not skip ahead.
2. Before coding each phase: restate the phase goal, list the files you will create,
   and list any ambiguity along with the default you chose.
3. After each phase: run all tests, then give me (a) a 5-line summary,
   (b) exact steps to demo it, (c) known gaps. Then stop and wait for my go-ahead.
4. NEVER hard-code criteria, scoring formulas, roles, labels, event types, stage names
   or thresholds. Everything must come from configuration (see Section 2).
5. If two parts of the spec conflict, Section 2 (Dynamic Principle) wins.
6. Prefer boring, well-supported libraries. Keep the scoring engine pure and fully
   unit-tested.
7. Never fabricate features I did not ask for. Put ideas in a "Suggestions" list instead.
```

### 0.2 Project context (edit before sending, or leave defaults)

| Setting | Default (override if needed) |
|---|---|
| Product name | JudgeHub (placeholder) |
| Primary use cases | Any competition or evaluation event |
| Scale target | 2,000 entries, 300 judges, 5,000 concurrent viewers per event |
| Platforms | Responsive web app + installable PWA (judges often use phones/tablets) |
| Languages | English first, fully i18n-ready (RTL-ready) |
| Hosting | Single region cloud, Docker-based, one-command local dev |
| Auth | Email magic link / OTP; optional Google SSO; no passwords by default |
| Data residency / privacy | Design for GDPR and India DPDP Act compliance |
| Budget posture | Open-source stack, no paid services required to run locally |

---

## 1. Vision and goals

**Vision:** One platform where an organizer can describe *how they want to judge* in a visual builder, and the software enforces that process fairly, transparently and in real time.

**Goals**
1. **Fully dynamic:** criteria, scales, weights, rounds, formulas, roles, forms, labels, and branding are all data.
2. **Fair and auditable:** every score is traceable; results are reproducible from stored inputs and a frozen config.
3. **Frictionless for judges:** scoring on a phone in under 30 seconds per entry, works with poor connectivity.
4. **Transparent when wanted:** live leaderboards, ceremony reveals, exportable result sheets with the math shown.
5. **Safe by design:** conflict-of-interest handling, blind judging, immutable audit trail.

**Non-goals (v1):** payments/ticketing, video streaming of the event itself, native mobile apps, AI auto-scoring of entries (may be a later plugin).

---

## 2. The Dynamic Principle (the most important section)

> If a behavior could differ between two events, it must be **configuration**, not code.

### 2.1 What must be configurable (checklist)
- **Terminology:** rename Judge → Reviewer/Examiner, Entry → Project/Contestant/Paper/Candidate, Round → Stage, etc. via a per-event `labels` dictionary.
- **Structure:** any number of stages (rounds), any number of tracks/categories, nested categories optional.
- **Entry form:** custom fields per event (text, long text, number, URL, file, image, select, multi-select, date, repeater for team members, etc.), validation, conditional visibility.
- **Criteria:** any number per stage/track, each with type, range, step, weight, descriptors, required/optional, visibility, conditional display.
- **Scoring:** judge-level formula, judge normalization, aggregation method, missing-score policy, rounding, tie-breakers, advancement rules.
- **Assignment:** how entries are distributed to judges.
- **Roles and permissions:** custom roles built from a permission matrix.
- **Visibility and reveal:** who sees what, and when (scores, comments, rank, judge identity).
- **Workflow:** score edit/lock rules, deadlines, reminders, approval steps.
- **Branding:** logo, colors, fonts, domain slug, email templates, certificate templates.
- **Data:** result exports and report layouts.

### 2.2 Architecture rules that make this real
1. **Schema-driven everything.** A single set of Zod/JSON-Schema definitions describes event config, criteria, forms and scoring. Forms, validation, API types and DB JSON columns are all derived from them.
2. **Plugin registries** (see Section 6): every *criterion type*, *scoring method*, *assignment strategy*, *tie-breaker*, *advancement rule* and *form field type* is a small registered module with `{ id, configSchema, ...behavior }`. Adding a new one must require **zero** changes to existing code, only a new file and a registry entry.
3. **Config is versioned and snapshotted.** When judging starts, the config is frozen into an immutable `event_version`. Later edits create a new version, show an impact preview, and may trigger recompute (Section 7.7).
4. **Templates and cloning.** Any event can be saved as a template and cloned. Ship built-in presets (Section 19).
5. **No magic strings.** UI text via i18n keys; event-specific text via the `labels` dictionary.

---

## 3. Users and roles

| Role | Scope | Key abilities |
|---|---|---|
| **Platform Super Admin** | Whole system | Manage organizations, plans/limits, global templates, impersonation (audited), system health |
| **Organization Owner/Admin** | Organization | Create events, manage members, billing/limits, branding, templates |
| **Event Organizer** | One event | Full event config, entries, judges, assignments, results, publish |
| **Head Judge / Panel Chair** | Event or panel | Everything a judge can do + resolve ties, approve score revisions, see panel progress, unlock scores |
| **Judge** | Assigned entries | Score, comment, flag conflict of interest, view own history |
| **Scorekeeper / Coordinator** | Event | Enter scores on behalf of judges (paper-based events), check-in entries, no config rights |
| **Participant / Team Lead** | Own entry | Submit/edit entry until deadline, view released feedback and results |
| **Auditor / Observer** | Event (read-only) | See full audit log and calculation breakdown, no edit rights |
| **Public / Audience** | Public page | View published leaderboard and optional audience vote |

- Roles are **data**: a `roles` table with a `permissions` array. Built-ins above are seeded defaults and can be edited or extended per organization.
- A user can hold different roles in different events (a judge in one, a participant in another).
- Permission checks use `can(user, action, resource)` in one central policy module, never ad hoc `if (role === ...)`.

---

## 4. Domain model (glossary)

- **Organization:** tenant that owns events.
- **Event:** a competition/evaluation with a lifecycle, config, timezone and branding.
- **Track / Category:** a subdivision of entries (e.g., "AI", "Junior", "Singing"). Criteria and judges may differ per track.
- **Stage (Round):** an ordered phase of judging (e.g., Screening → Semi-final → Final). Each has its own criteria, judges, scoring and advancement rule.
- **Entry:** thing being judged (project, performer, team, paper, candidate). Has dynamic form data and optional members.
- **Judge:** a person scoring entries. Has optional weight, expertise tags and conflicts.
- **Panel:** named group of judges attached to a stage/track.
- **Criterion:** one dimension of evaluation (e.g., Innovation).
- **Rubric:** a criterion with level descriptors (e.g., 1 = Poor ... 5 = Excellent, each with text).
- **Score (Evaluation):** one judge's complete set of criterion values for one entry in one stage. Status: `draft → submitted → locked`.
- **Assignment:** the link "judge J must evaluate entry E in stage S".
- **Result:** computed, versioned standings for a stage/track, with a full calculation breakdown.

---

## 5. Event lifecycle (state machine)

```
DRAFT → SETUP → SUBMISSIONS_OPEN → SUBMISSIONS_CLOSED → JUDGING → JUDGING_CLOSED
      → RESULTS_REVIEW → RESULTS_PUBLISHED → ARCHIVED
```
- Stages have their own mini-state: `PENDING → ACTIVE → CLOSED → FINALIZED`.
- Transitions can be **manual** or **scheduled** (open/close at timestamps in the event timezone).
- Guardrails (configurable, with sensible defaults): cannot start judging without ≥1 stage, ≥1 criterion, ≥1 judge, all entries assigned; cannot publish with incomplete scores unless explicitly overridden (reason logged).
- Every transition writes an audit log entry.

---

## 6. Plugin registries (core of dynamism)

Each registry entry exposes `id`, `label` (i18n), `configSchema` (Zod), and the behavior below.

### 6.1 Criterion types
| Type | Value shape | Normalizer → 0..1 |
|---|---|---|
| `scale` (numeric / slider / stars) | number within `min..max` by `step` | `(v-min)/(max-min)` |
| `rubric` (levels with descriptors) | level id | `levelPoints / maxPoints` |
| `boolean` (yes/no, pass/fail) | true/false | 1/0 (configurable) |
| `choice` (single, points per option) | option id | `points / maxPoints` |
| `multichoice` (checklist, points per item) | option id[] | `sum / maxSum` |
| `ranking` (rank entries against each other) | rank integer | consumed by rank-based methods only |
| `pairwise` (A vs B preference) | winner id | consumed by pairwise methods only |
| `text` (feedback, not scored) | string | n/a |
| `file` (annotated PDF, audio note) | file id | n/a |
| `computed` (derived from other criteria via expression) | number | via expression |

Common config on every criterion: `key`, `label`, `description`, `weight` (default 1; ignored for non-scored types), `required`, `visibleTo` (judge/participant/public, with reveal timing), `showIf` (condition on other criteria or entry fields), `commentPolicy` (none/optional/required, optionally "required if score ≤ X").

### 6.2 Scoring methods (aggregation across judges)
`mean`, `weighted_mean` (judge weights), `median`, `trimmed_mean` (drop k highest/lowest), `olympic` (drop 1 high + 1 low), `sum`, `min`, `max`, plus rank-based: `borda`, `instant_runoff` (IRV), `schulze`, `condorcet_copeland`; pairwise: `bradley_terry`, `elo`. Custom: `expression` (Section 7.4).

### 6.3 Judge normalization (to correct harsh/lenient judges)
`none`, `zscore_per_judge`, `minmax_per_judge`, `rank_transform`. Applied only when the judge has scored ≥ N entries (configurable minimum, default 5), otherwise falls back to `none` with a flag in the breakdown.

### 6.4 Assignment strategies
`all_judges_all_entries`, `balanced_random` (each entry gets K judges, load-balanced), `round_robin`, `by_track` (judges tagged to tracks), `by_expertise_tags` (match tags with scoring), `manual`, `rooms_and_timeslots` (live events). All strategies respect: COI exclusions, max load per judge, min/max judges per entry, and can be re-run for unassigned entries only.

### 6.5 Tie-breakers (ordered chain)
`criterion_score` (higher on criterion X), `median`, `most_first_places`, `head_judge_decision`, `head_to_head`, `coin_flip_seeded` (deterministic seed, logged), `shared_rank` (declare a tie). The chain is configured per stage; every applied tie-break is stored in `tie_break_log`.

### 6.6 Advancement rules
`top_n`, `top_percent`, `score_threshold`, `top_n_per_track`, `wildcards` (organizer picks X extra), `manual_selection`, `combined` (AND/OR of the above).

### 6.7 Form field types (entry/judge/participant forms)
`text`, `textarea`, `number`, `email`, `phone`, `url`, `date`, `select`, `multiselect`, `checkbox`, `file`, `image`, `repeater` (e.g., team members), `section`, `consent`. All support validation, `showIf`, help text, and per-role visibility.

---

## 7. Scoring engine specification

The scoring engine is a **pure TypeScript package** with no database or framework imports: `compute(configSnapshot, inputs) → resultWithBreakdown`. It must be deterministic (same input → same output, including seeded randomness).

### 7.1 Pipeline
```
1. Validate     raw values vs criterion config (range, step, required, showIf)
2. Normalize    each criterion to 0..1 via its type's normalizer
3. Judge score  J(j,e) = scale * Σ(w_c * n_c) / Σ(w_c for answered criteria)
                (or custom expression)
4. Normalize judges (optional) z-score / min-max / rank transform per judge
5. Aggregate    across judges using the stage's scoring method (+ judge weights)
6. Combine      multiple stages/tracks via carry-over weights (optional)
7. Rank         sort descending, assign ranks (dense / standard / ordinal, configurable)
8. Tie-break    run configured chain, log each decision
9. Advance      apply advancement rule → mark advancing / eliminated / wildcard
10. Explain     emit a full breakdown object (every intermediate number)
```

### 7.2 Missing-score policy (per stage)
`require_all` (cannot finalize until complete), `ignore_missing` (average over available judges), `impute_mean`, `treat_as_zero`. Minimum judges per entry for validity is configurable; entries below it are flagged "insufficient data".

### 7.3 Precision and rounding
Store raw values at full precision (decimal-safe, e.g., integers in minor units or `numeric`). Round **only for display and final ranking**, using configurable decimals (default 2) and rounding mode (default half-up). Ranking uses the unrounded value unless configured otherwise.

### 7.4 Expression language (for computed criteria and custom formulas)
- Use a **safe, sandboxed** expression engine (e.g., CEL, JSONLogic, or expr-eval). **Never use `eval`/`Function`.**
- Variables: criterion keys (`innovation`, `impact`), `judgeWeight`, entry form fields (`entry.teamSize`), aggregates (`avg`, `median`, `count`).
- Functions: `sum, avg, min, max, clamp, round, abs, if, coalesce, pow`.
- Expressions are validated at save time (parse, type-check against known variables, test with sample data) and have execution time/step limits.
- Example: `clamp(0.5*innovation + 0.3*impact + 0.2*execution - if(entry.lateSubmission, 2, 0), 0, 10)`

### 7.5 Judge weighting
Per judge `weight` (default 1). Options: fixed weights set by organizer, weights per criterion (e.g., a domain expert's vote counts double on "Technical depth"), or weights derived from expertise tags.

### 7.6 Worked example (include as a test fixture)
Criteria: Innovation (w3, 0-10), Impact (w2, 0-10), Presentation (w1, 0-10). Judge A scores 8/6/9 → `(3*.8 + 2*.6 + 1*.9)/6 = 0.75` → 75.0. Judge B scores 6/7/5 → `(.6*3+.7*2+.5)/6 = 0.6167` → 61.67. Judge C scores 9/9/8 → `(2.7+1.8+.8)/6 = 0.8833` → 88.33. With `trimmed_mean(trim=1)` over three judges only the median remains → 75.0. With `mean` → 75.0 as well. Add more fixtures where the two methods differ.

### 7.7 Config changes after scoring has started
- Classify changes: **safe** (labels, descriptions, branding, deadlines) vs **breaking** (weights, ranges, formulas, adding/removing criteria, scoring method).
- Breaking changes require: a diff view, an **impact preview** (old vs new standings side by side), a mandatory reason, and creation of a new `event_version`.
- Option to either recompute everything under the new version or keep the old version for already-submitted scores. Both results remain stored for audit.
- Removing a criterion with existing scores archives those scores, never deletes them.

### 7.8 Explainability
Every result row exposes `breakdown`: per-judge raw values, normalized values, judge scores, applied weights, normalization parameters, aggregation inputs and tie-break steps. The UI renders this as "Show the math" for organizers, auditors and (optionally) participants.

---

## 8. Data model (PostgreSQL; JSONB for dynamic parts)

Use UUID primary keys, `created_at/updated_at`, soft-delete where noted, and `organization_id` on all tenant data (with row-level security).

| Table | Key columns |
|---|---|
| `organizations` | id, name, slug, plan, settings(jsonb) |
| `users` | id, email, name, locale, timezone, avatar, last_login |
| `roles` | id, organization_id, key, name, permissions(text[]), is_builtin |
| `memberships` | id, user_id, organization_id, event_id (nullable), role_id, status, invited_by |
| `events` | id, organization_id, slug, name, status, timezone, current_version_id, labels(jsonb), theme(jsonb), visibility(jsonb), starts_at, ends_at |
| `event_versions` | id, event_id, version_no, config(jsonb, frozen), created_by, reason, created_at |
| `tracks` | id, event_id, key, name, parent_id, config(jsonb), position |
| `stages` | id, event_id, key, name, position, status, opens_at, closes_at, config(jsonb) *(criteria, scoring, tie-breakers, advancement live here, validated by Zod)* |
| `form_definitions` | id, event_id, kind(entry/judge/participant), fields(jsonb), version |
| `entries` | id, event_id, track_id, code (public anonymized id), title, status, form_data(jsonb), submitted_at, disqualified_reason |
| `entry_members` | id, entry_id, user_id (nullable), name, email, role, extra(jsonb) |
| `files` | id, owner_type, owner_id, storage_key, mime, size, sha256, scan_status |
| `judges` | id, event_id, user_id, weight, tags(text[]), max_load, status |
| `panels` | id, event_id, stage_id, track_id, name, chair_judge_id |
| `panel_members` | panel_id, judge_id |
| `assignments` | id, stage_id, judge_id, entry_id, status, source(auto/manual), assigned_at |
| `conflicts` | id, judge_id, entry_id, kind(declared/auto-detected), reason, status |
| `evaluations` | id, assignment_id, stage_id, judge_id, entry_id, status(draft/submitted/locked), source(judge/scorekeeper/import), entered_by_user_id (differs from judge when a scorekeeper enters paper scores), version_no, submitted_at, total_cached, event_version_id |
| `evaluation_values` | id, evaluation_id, criterion_key, value(jsonb), comment |
| `evaluation_revisions` | id, evaluation_id, snapshot(jsonb), changed_by, reason, at |
| `results` | id, stage_id, track_id, event_version_id, computed_at, status(draft/final), breakdown(jsonb) |
| `result_rows` | id, result_id, entry_id, rank, score, advanced, flags(jsonb), breakdown(jsonb) |
| `tie_break_log` | id, result_id, entry_ids, step, method, outcome, seed |
| `audience_votes` | id, event_id, entry_id, voter_hash, weight, created_at *(optional module)* |
| `audit_log` | id, organization_id, actor_id, action, resource_type, resource_id, before(jsonb), after(jsonb), ip, user_agent, at *(append-only, hash-chained)* |
| `notifications` | id, user_id, kind, payload(jsonb), channel, status |
| `webhooks` | id, event_id, url, secret, events(text[]), active |
| `templates` | id, organization_id (null = global), name, kind, config(jsonb) |
| `exports` | id, event_id, kind, format, params(jsonb), file_id, status |

Constraints worth enforcing in DB: unique `(stage_id, judge_id, entry_id)` on assignments; unique `(assignment_id)` for the active evaluation; check that a judge in `conflicts` cannot hold an assignment for that entry; `audit_log` has no UPDATE/DELETE grants.

---

## 9. Functional requirements by module

Each requirement should become a tracked task with acceptance criteria. IDs are for traceability.

### 9.1 Event Builder (organizer)
- **EB-1** Guided wizard: basics → tracks → entry form → stages → criteria → scoring → judges → assignment → visibility → review & publish.
- **EB-2** Visual **criteria builder**: drag-and-drop ordering, live preview of exactly what a judge will see, weight sliders with auto-normalization display ("weights sum to 100%").
- **EB-3** **Rubric editor** with level descriptors and optional point values.
- **EB-4** **Scoring sandbox:** enter fake judge scores and instantly see ranks and breakdown before the event goes live.
- **EB-5** Stage designer: add stages, set advancement, carry-over weights.
- **EB-6** Templates: start from preset, clone past event, save as template, import/export config as JSON (validated).
- **EB-7** Config validation panel listing errors/warnings (e.g., "Track B has no judges", "weights sum to 0").
- **EB-8** Version history with diff and restore.

### 9.2 Entries
- **EN-1** Public/private submission page generated from the form definition; save draft; deadline enforcement; late-submission policy.
- **EN-2** Bulk import (CSV/XLSX) with column mapping, validation report, and dry run.
- **EN-3** Manual add/edit by organizer, check-in status, disqualify/withdraw with reason.
- **EN-4** Anonymized public `code` (e.g., E-0427) used in blind judging.
- **EN-5** Duplicate detection (same email/title, configurable).

### 9.3 Judges
- **JD-1** Invite by email/link/CSV; accept flow; optional profile (bio, tags, photo).
- **JD-2** COI declaration screen and auto-detection (same organization/email domain as an entry member, configurable).
- **JD-3** Per-judge weight, tags, max load, availability windows.
- **JD-4** Judge dashboard: assigned entries, progress bar, deadlines, drafts, filters.

### 9.4 Assignment
- **AS-1** Run strategy with preview; show load balance chart and coverage matrix (entries × judges).
- **AS-2** Manual override with drag/drop and bulk actions; warn on COI and over-load.
- **AS-3** Reassign when a judge drops out; keeps already-submitted scores intact.
- **AS-4** Live events: rooms/time slots and a "now judging" queue.

### 9.5 Judging experience
- **JX-1** Mobile-first scoring form generated from the stage's criteria; large touch targets; one-hand operation.
- **JX-2** **Autosave** every change; clear save-state indicator; offline queue (Section 12).
- **JX-3** Entry viewer: shows form data, attached files, links, embedded media preview; optional blind mode hides identifying fields.
- **JX-4** Keyboard shortcuts on desktop (number keys to score, Tab to move, Cmd/Ctrl+Enter to submit).
- **JX-5** Submit → optional confirm → lock per config; edit window and "request unlock" flow with chair approval.
- **JX-6** Judges can see progress and (if allowed) a private view of their own ranking to sanity-check themselves.
- **JX-7** Comparison mode: view two entries side-by-side (needed for pairwise/ranking).
- **JX-8** Reminders (email/push) before deadline; nudge for incomplete evaluations.

### 9.6 Scorekeeper mode
- **SK-1** Fast grid entry for paper scoresheets (entries as rows, criteria as columns), keyboard-only friendly, with double-entry verification option.
- **SK-2** Printable scoresheets generated from the rubric (PDF with entry codes and QR).

### 9.7 Results and leaderboard
- **RS-1** Draft results recomputed live as scores arrive, visible only to permitted roles.
- **RS-2** Leaderboard configurable: show rank only / score / full breakdown; per-track filtering; auto-refresh via WebSocket.
- **RS-3** **Ceremony mode:** full-screen, projector-friendly reveal (reverse order, one at a time, animation, keyboard "next").
- **RS-4** Finalize → freezes result version; publishing is a separate explicit action.
- **RS-5** Tie resolution screen showing the chain, with chair decision capture.
- **RS-6** Judge-agreement analytics (inter-judge variance, outlier judges, score distribution per judge) to spot bias.
- **RS-7** Feedback release: send participants their (configurable subset of) scores and comments, anonymized judge identity by default.

### 9.8 Participant portal
- Submit/edit entry; see status; receive results and feedback; download certificate (templated PDF with QR verification).

### 9.9 Public page
- Branded event page with schedule, entries gallery, leaderboard, optional audience vote (one vote per verified identity/device, rate-limited, weight configurable relative to judges).

### 9.10 Communication
- Email templates per event (invite, reminder, results) with variables; in-app notifications; optional SMS/WhatsApp via provider adapter.

### 9.11 Exports and reporting
- CSV/XLSX/PDF/JSON for: results, full score matrix, per-judge sheets, audit log, assignment matrix.
- "Official result sheet" PDF with the calculation method printed on it.
- Webhooks and a read-only API token for integrations.

---

## 10. UI/UX requirements

- **Design system:** Tailwind + a component library (shadcn/ui or equivalent), light/dark themes, per-event theme tokens (primary color, logo, font).
- **Accessibility:** WCAG 2.1 AA, full keyboard navigation, screen-reader labels, color is never the only signal.
- **Responsive:** judge and participant flows designed for 360px width first; organizer builder usable on tablet.
- **Key screens:**
  1. Organizer dashboard (event health: submissions, judge progress, issues)
  2. Event builder wizard and settings
  3. Criteria/rubric builder with live judge preview
  4. Entries table (filter, sort, bulk actions) and entry detail
  5. Judges table and assignment matrix
  6. Judge home and scoring screen
  7. Scorekeeper grid
  8. Results workspace (standings, breakdown drawer, tie resolution, analytics)
  9. Leaderboard (embedded/public) and ceremony mode
  10. Audit log viewer
  11. Participant portal
- **Empty, loading and error states** for every screen. Optimistic UI where safe.
- **Progress visibility:** judge progress rings, organizer "who hasn't finished" list with one-click reminder.

---

## 11. API and integration design

- REST under `/api/v1`, OpenAPI generated from the same Zod schemas; consistent error format `{ code, message, details }`; cursor pagination; idempotency keys on write endpoints.
- Representative endpoints:
  - `POST /events`, `GET/PATCH /events/:id`, `POST /events/:id/transition`
  - `GET/PUT /events/:id/config` (validated), `GET /events/:id/versions`
  - `CRUD /events/:id/stages`, `/tracks`, `/entries`, `/judges`
  - `POST /stages/:id/assignments/run`, `GET /stages/:id/assignments`
  - `GET /judges/me/assignments`, `PUT /evaluations/:id` (autosave), `POST /evaluations/:id/submit`
  - `POST /stages/:id/results/compute`, `GET /stages/:id/results`, `POST /results/:id/finalize|publish`
  - `GET /events/:id/audit`, `POST /events/:id/exports`
  - `POST /events/:id/import/entries` (dry-run flag)
- **Real-time:** WebSocket or SSE channels `event:{id}:leaderboard`, `judge:{id}:assignments`, `event:{id}:progress`. Server broadcasts diffs; clients can recover by refetching.
- **Webhooks** (HMAC-signed): `entry.submitted`, `evaluation.submitted`, `stage.closed`, `results.published`.
- **Adapters** (interfaces with default implementations): `EmailProvider`, `StorageProvider` (local/S3), `SmsProvider`, `AuthProvider`, `ClockProvider` (for tests).

---

## 12. Real-time and offline behavior

- Judge scoring screens are a **PWA** with service worker caching of the assigned entries and form definitions.
- Writes go to a local queue (IndexedDB), sync when online, with per-evaluation **version numbers** for optimistic concurrency.
- Conflict policy: last-write-wins for a single judge's own draft; **hard conflict** (server copy newer or locked) opens a merge prompt rather than silently overwriting.
- UI always shows: Saved / Saving / Offline, queued changes / Sync failed with retry.
- Leaderboard load: serve from cached computed result with short TTL; recompute incrementally per entry on each new submitted evaluation; debounce broadcasts.

---

## 13. Security, integrity and fairness

- **AuthN:** magic link/OTP, optional OAuth/SSO, short-lived sessions, device list, rate-limited login. Judge invite links are single-use and expire.
- **AuthZ:** central policy module + Postgres RLS by `organization_id`; judges can only read assigned entries and only their own evaluations; participants only their own entry.
- **Blind judging:** configurable hiding of identity fields; scrub file metadata (EXIF, doc author) on upload; use entry codes everywhere judges can see.
- **Conflict of interest:** declared + auto-detected; assignment engine excludes; scoring endpoint rejects evaluations from conflicted judges.
- **Audit log:** append-only, hash-chained (each row stores hash of previous), covers config changes, assignments, score submissions/edits/unlocks, result compute/finalize/publish, exports, logins of privileged roles. Viewer includes a verify-integrity check.
- **Score integrity:** submitted scores are immutable except via logged revision with reason and (configurable) chair approval; final results are tied to the exact `event_version` and score revision set used.
- **Input safety:** validate everything server-side with Zod; sanitize rich text; upload limits, MIME sniffing, antivirus scan hook; CSRF/XSS/SQLi protections; signed URLs for files.
- **Abuse protection (audience voting, submissions):** rate limits, CAPTCHA option, device fingerprint hash (privacy-preserving), duplicate-vote rules.
- **Privacy:** data minimization, consent capture, per-event retention policy with automated deletion/anonymization, data export and deletion requests, encryption in transit and at rest, secrets via environment/secret manager.
- **Backups and recovery:** daily automated backups, point-in-time recovery, restore tested.

---

## 14. Non-functional requirements

| Area | Target |
|---|---|
| Judge save latency | p95 < 300 ms (online) |
| Leaderboard update after submit | < 3 s to connected viewers |
| Full result recompute (2,000 entries × 10 criteria × 300 judges) | < 10 s, off the request thread |
| Concurrency | 5,000 viewers, 300 simultaneous judges |
| Availability | 99.9% during event windows; graceful degradation to read-only |
| Accessibility | WCAG 2.1 AA |
| Browser support | Last 2 versions of Chrome, Safari, Firefox, Edge; iOS Safari and Android Chrome |
| Observability | Structured logs, error tracking, metrics (queue depth, WS connections, compute time), health endpoints |
| i18n | ICU message format, locale-aware numbers/dates, RTL layout support |
| Code quality | TypeScript strict, ESLint, Prettier, ≥ 90% coverage on scoring engine, ≥ 70% overall |

---

## 15. Recommended tech stack (swappable, but justify any change)

- **Language:** TypeScript end to end.
- **Frontend:** Next.js (App Router) + React, Tailwind, shadcn/ui, TanStack Query, React Hook Form + Zod resolver, dnd-kit for drag/drop, next-intl for i18n, Workbox/serwist for PWA.
- **Backend:** Next.js route handlers or a separate Node service (Fastify/NestJS) if you prefer separation; tRPC optional, but REST + OpenAPI is required for integrations.
- **Database:** PostgreSQL (JSONB, RLS), Drizzle or Prisma ORM, migrations versioned in repo.
- **Cache/queue/real-time:** Redis (cache, pub/sub), BullMQ for background jobs (recompute, exports, emails), WebSocket (Socket.IO/ws) or SSE.
- **Files:** S3-compatible storage (MinIO locally).
- **Auth:** Auth.js / Lucia / Supabase Auth, using email OTP.
- **PDF/Excel:** server-side headless Chromium or react-pdf for PDFs; ExcelJS for XLSX.
- **Testing:** Vitest (unit), Playwright (e2e), fast-check (property tests for the scoring engine), k6 (load).
- **DevOps:** Docker Compose for local; GitHub Actions CI (lint, typecheck, test, build); deploy to any container host.
- **Alternative all-in-one:** Supabase (Postgres + Auth + Realtime + Storage) to cut infrastructure work.

### 15.1 Repo structure (monorepo)
```
/apps/web            Next.js app (UI + API routes)
/apps/worker         Background jobs (compute, exports, notifications)
/packages/schemas    Zod schemas = single source of truth (config, forms, API)
/packages/scoring    Pure scoring engine + registries + fixtures
/packages/registry   Criterion types, assignment strategies, field types (plugin interfaces)
/packages/policy     Permission definitions + can() function
/packages/ui         Shared components, schema-driven form renderer
/packages/db         Schema, migrations, seed (incl. preset templates)
/docs                Architecture notes, ADRs, runbooks
```

---

## 16. Architecture overview

1. **Config layer:** Zod schemas validate config on write; stored as JSONB; frozen into `event_versions`.
2. **Domain services:** EventService, EntryService, AssignmentService, EvaluationService, ResultService, each depending only on interfaces.
3. **Scoring package:** pure functions; called by the worker (full recompute) and by the API (incremental).
4. **Schema-driven UI:** `<DynamicForm schema=... />` renders entry forms, judge scoring forms and settings from definitions; criterion widgets come from the registry's `Widget` component.
5. **Event bus:** domain events (`evaluation.submitted`) trigger recompute, notifications, webhooks and WebSocket broadcasts.
6. **Read models:** cached leaderboard tables updated incrementally to keep reads cheap during live events.

---

## 17. Build plan (phased; stop and demo after each phase)

### Phase 0: Foundations (2-3 days)
Monorepo, tooling, CI, Docker Compose (Postgres, Redis, MinIO), auth skeleton, org/user/role/membership tables, central `can()` policy, audit log helper, i18n scaffold, design system basics.
**Done when:** a user can sign in, create an organization, and an audit entry is recorded; CI is green.

### Phase 1: Core MVP: one static-ish event end to end (1-2 weeks)
Events + lifecycle, entries (manual + CSV import), judges + invites, simple criteria (`scale`), `all_judges_all_entries` + manual assignment, judge scoring screen with autosave, mean aggregation, basic results table, CSV export.
**Done when:** an organizer can run a complete small competition and export results.

### Phase 2: The dynamic core (1-2 weeks)
Zod config schemas, `event_versions`, **registries** with criterion types (`scale`, `rubric`, `boolean`, `choice`, `text`, `computed`), schema-driven form renderer, visual criteria/rubric builder with live preview, custom entry form builder, labels dictionary, templates (clone/import/export JSON), validation panel.
**Done when:** the three preset events (Section 19) can be created purely through the UI/JSON with no code edits, and adding a new criterion type requires only a new registry file.

### Phase 3: Scoring depth (1-2 weeks)
All aggregation methods, judge weights, judge normalization, missing-score policy, rounding, tie-breaker chain, expression engine, scoring sandbox, "show the math" breakdown, full golden-fixture and property tests.
**Done when:** every method in Section 6 has fixtures proving expected results; sandbox matches production output exactly.

### Phase 4: Multi-stage and assignment strategies (1 week)
Multiple stages and tracks, advancement rules, carry-over weights, all assignment strategies with COI, load balancing, preview and coverage matrix, panels and chairs.
**Done when:** a 3-stage event auto-advances top N, and reassigning after a judge drops out preserves existing scores.

### Phase 5: Real-time, leaderboard, ceremony (1 week)
WebSocket/SSE, incremental recompute, live leaderboard (embed + public), progress dashboard, ceremony mode, notifications and reminders, finalize/publish flow.
**Done when:** a leaderboard updates under 3 seconds after a judge submits, verified by an e2e test.

### Phase 6: Offline PWA and scorekeeper tools (1 week)
Service worker, IndexedDB queue, conflict handling, scorekeeper grid, printable scoresheets with QR.
**Done when:** a judge can score entirely offline for 10 entries, reconnect, and sync without loss (e2e with network throttling).

### Phase 7: Participant, public, audience and reporting (1 week)
Participant portal and feedback release, public event page, audience voting with abuse controls, analytics (judge agreement), certificate generator, official PDF result sheet, XLSX exports, webhooks, API tokens.

### Phase 8: Hardening and launch (1 week)
RLS audit, security review checklist, load test to Section 14 targets, accessibility audit, backup/restore drill, docs (admin guide, judge quick-start, runbook), seed demo data.
**Done when:** all non-functional targets are met or documented exceptions exist.

---

## 18. Testing strategy

- **Scoring engine:** golden fixtures (hand-verified spreadsheets) for each method; property tests (adding a constant to all scores doesn't change ranks under `mean`; permuting judge order doesn't change results; weights scaling invariance; trimmed mean is bounded by min/max); determinism test with seeded tie-breaks.
- **Config validation:** fuzz invalid configs; every Zod schema has valid and invalid examples.
- **Permissions:** matrix test of every role × action × resource must match the policy table.
- **E2E (Playwright):** full lifecycle per preset; offline scenario; two judges editing simultaneously; late submission; unlock request; disqualification mid-event.
- **Load (k6):** 300 judges autosaving + 5,000 viewers on leaderboard.
- **Security:** authz bypass attempts (IDOR), upload abuse, rate-limit checks, audit-chain tamper detection test.
- **Seed data:** generator producing realistic events of configurable size for demos and load tests.

---

## 19. Preset templates (ship these; also use them as acceptance tests)

### 19.1 Hackathon (multi-stage, weighted, normalized)
```json
{
  "labels": { "entry": "Project", "judge": "Judge", "stage": "Round" },
  "tracks": [{ "key": "ai", "name": "AI/ML" }, { "key": "web", "name": "Web & Mobile" }],
  "entryForm": { "fields": [
    { "key": "title", "type": "text", "required": true },
    { "key": "pitch", "type": "textarea", "required": true, "maxLength": 500 },
    { "key": "demoUrl", "type": "url" },
    { "key": "team", "type": "repeater", "fields": [{ "key": "name", "type": "text" }, { "key": "email", "type": "email" }] }
  ]},
  "stages": [
    {
      "key": "screening", "name": "Online Screening",
      "assignment": { "strategy": "balanced_random", "judgesPerEntry": 3, "avoidCOI": true },
      "criteria": [
        { "key": "innovation", "type": "scale", "label": "Innovation", "min": 0, "max": 10, "step": 0.5, "weight": 3 },
        { "key": "impact", "type": "scale", "label": "Impact", "min": 0, "max": 10, "step": 0.5, "weight": 2 },
        { "key": "execution", "type": "scale", "label": "Execution", "min": 0, "max": 10, "step": 0.5, "weight": 2 },
        { "key": "notes", "type": "text", "label": "Feedback", "scored": false }
      ],
      "scoring": {
        "judgeScore": { "method": "weighted_mean", "scale": 100 },
        "judgeNormalization": { "method": "zscore_per_judge", "minScored": 5 },
        "aggregate": { "method": "trimmed_mean", "trim": 1 },
        "missing": "ignore_missing", "minJudgesPerEntry": 2, "decimals": 2
      },
      "tieBreakers": [{ "by": "criterion_score", "key": "innovation" }, { "by": "median" }, { "by": "head_judge_decision" }],
      "advance": { "rule": "top_n_per_track", "n": 10 }
    },
    {
      "key": "final", "name": "Live Finals",
      "assignment": { "strategy": "all_judges_all_entries" },
      "criteria": [
        { "key": "demo", "type": "rubric", "label": "Demo Quality", "levels": [
          { "id": 1, "label": "Broken", "points": 1 }, { "id": 3, "label": "Works", "points": 3 }, { "id": 5, "label": "Outstanding", "points": 5 } ] },
        { "key": "pitch", "type": "scale", "label": "Pitch", "min": 1, "max": 10, "step": 1, "weight": 1 }
      ],
      "scoring": { "aggregate": { "method": "mean" }, "carryOver": { "fromStage": "screening", "weight": 0.3 } },
      "advance": { "rule": "top_n", "n": 3 }
    }
  ]
}
```

### 19.2 Talent show (ranked ballots + audience vote)
Single stage; each judge **ranks** their top 5 (`ranking` criterion); aggregation `borda`; audience vote contributes 20% via `combined` weighting; tie-break `most_first_places` then `head_judge_decision`; ceremony mode on; judge names hidden from the public.

### 19.3 Academic paper / grant review (blind, rubric, recusal)
Double-blind (hide author fields, scrub file metadata); 3 reviewers per paper by `by_expertise_tags`; rubric criteria with required comment if score ≤ 2; `median` aggregation; recommendation `choice` (accept/revise/reject) with points; reviewer COI auto-detected by institution; results released as anonymized feedback to authors; no leaderboard.

### 19.4 (Optional extra) Pitch competition, science fair, debate, sports-style (Olympic scoring: drop high and low), hiring panel (pass/fail gates then weighted score)
Provide as additional seed templates after Phase 3.

---

## 20. Edge cases the implementation must handle

1. Judge declines or disappears mid-event: reassign, keep submitted scores, mark pending drafts.
2. Entry disqualified or withdrawn after scoring: excluded from ranking, scores retained and flagged.
3. Fewer judges than the minimum for an entry: flagged "insufficient data", cannot finalize unless overridden with reason.
4. Unequal judge counts per entry: aggregation and normalization must remain fair (the breakdown shows counts).
5. A judge tries to score a conflicted entry (direct API call): rejected and audit-logged.
6. Tie at an advancement cutoff: run the tie-break chain; if unresolved, require chair decision or allow configurable "advance all tied".
7. Config changed after scoring started: Section 7.7 flow.
8. Late entry submitted after assignments were generated: incremental assignment for new entries only.
9. Judge edits a submitted score after the stage closed: blocked unless an unlock was approved; revision stored.
10. Clock and timezone issues: all timestamps UTC in DB, shown in the event timezone, deadline checks server-side only.
11. Duplicate audience votes and bot traffic.
12. Very large events: pagination everywhere, background jobs for recompute and exports, no N+1 queries.
13. File anonymization failure (cannot scrub): warn organizer, allow a manual redaction override.
14. Partial scoring: judge scores only some criteria: policy decides whether the evaluation is valid.
15. Rounding differences between UI, export and PDF: all must come from the same engine output.
16. Browser closed mid-score: draft preserved; resume where left off.
17. Re-running assignment must be idempotent and never delete submitted evaluations.

---

## 21. Rules for the AI builder (working agreements)

- **Definition of done** for any task: code + types + tests + docs note + seed/preset update if relevant + no hard-coded event-specific values.
- Commit in small, logical steps with clear messages; keep a `CHANGELOG.md` and ADRs (`/docs/adr`) for major decisions.
- The scoring engine must have **no I/O**. If you need data, pass it in.
- Every public function in `packages/scoring` has JSDoc plus at least one fixture test.
- Prefer composition over inheritance; registries over `switch` statements on type strings.
- Do not introduce paid or closed services without asking. Provide a local fallback for each adapter.
- When unsure, choose the **safer, more auditable** option and write the assumption in `/docs/assumptions.md`.
- Surface a "Suggestions" list at the end of each phase rather than adding unrequested features.

---

## 22. Assumptions and open decisions (change any you disagree with)

1. Multi-tenant SaaS-style structure even if you only run it for one organization.
2. Passwordless auth is acceptable for all roles.
3. Audience voting is optional and off by default.
4. Judge identities are hidden from participants by default.
5. Scores are stored raw; rounding is display/ranking-time only.
6. Results are never published automatically; publishing is always a deliberate action.
7. English UI at launch, with all strings externalized.

---

## 23. Future roadmap (not in v1)

AI-assisted features (summarize entry for judges, flag inconsistent scoring, draft feedback), native mobile apps, video/live-streaming integrations, marketplace of community presets and plugins, sponsor/prize management, white-label domains, advanced fairness analytics (Bradley-Terry judge-bias models), calendar/room scheduler for in-person events.
