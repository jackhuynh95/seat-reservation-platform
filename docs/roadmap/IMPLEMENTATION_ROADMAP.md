# Implementation Roadmap

Status values:

- `Planned`: not started.
- `Ready`: can start after user approval.
- `In Progress`: actively being worked.
- `Done`: implemented and verified.
- `Blocked`: waiting on a decision.

## Phase 0 - Specification Foundation

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 0.1 | Assignment brief captured | none | Done |
| 0.2 | Review checklist mapped | 0.1 | Done |
| 0.3 | Functional spec drafted | 0.1, 0.2 | Done |
| 0.4 | Architecture notes drafted | 0.2 | Done |
| 0.5 | Guardrails drafted | 0.2 | Done |
| 0.6 | Scoring, quick scan, and common best-practice docs | 0.2 | Done |

Detailed tasks: [Phase 0](phases/phase-00-specification-foundation.md)

## Phase 1 - Monorepo And Infrastructure Foundation

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 1.1 | Decide package manager and workspace layout | 0.5 | Planned |
| 1.2 | Define app roots and shared package roots | 1.1 | Planned |
| 1.3 | Finalize Compose infrastructure | 1.2 | Planned |
| 1.4 | Define environment variable contract | 1.3 | Planned |
| 1.5 | Add first decision records | 1.1 | Planned |
| 1.6 | Define TypeScript strict and shared config baseline | 1.1 | Planned |
| 1.7 | Define database migration and pool conventions | 1.3 | Planned |

Detailed tasks: [Phase 1](phases/phase-01-monorepo-and-infrastructure-foundation.md)

## Phase 2 - Service Baselines

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 2.1 | Scaffold gateway | 1.5 | Planned |
| 2.2 | Scaffold auth-service | 1.5 | Planned |
| 2.3 | Scaffold seat-service | 1.5 | Planned |
| 2.4 | Scaffold payment-service | 1.5 | Planned |
| 2.5 | Add per-service health endpoints | 2.1, 2.2, 2.3, 2.4 | Planned |
| 2.6 | Add structured logging and correlation ID | 2.1 | Planned |
| 2.7 | Add API validation baseline | 2.1, 2.2, 2.3, 2.4 | Planned |
| 2.8 | Add graceful shutdown baseline | 2.1, 2.2, 2.3, 2.4 | Planned |

Detailed tasks: [Phase 2](phases/phase-02-service-baselines.md)

## Phase 3 - Authentication And Session Security

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 3.1 | User schema and migrations | 2.2 | Planned |
| 3.2 | Argon2id login | 3.1 | Planned |
| 3.3 | Refresh token httpOnly cookie | 3.2 | Planned |
| 3.4 | Refresh token hashing and rotation | 3.3 | Planned |
| 3.5 | Logout and logout-all | 3.4 | Planned |
| 3.6 | Auth tests | 3.2, 3.4, 3.5 | Planned |
| 3.7 | Auth rate limit and audit logging | 3.2 | Planned |

Detailed tasks: [Phase 3](phases/phase-03-authentication-and-session-security.md)

## Phase 4 - Seat Hold And Reservation

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 4.1 | Seat schema and seed 3 seats | 2.3 | Planned |
| 4.2 | Atomic hold operation | 4.1 | Planned |
| 4.3 | One hold per user invariant | 4.2 | Planned |
| 4.4 | Hold expiry cleanup | 4.2 | Planned |
| 4.5 | Seat list and status APIs | 4.1 | Planned |
| 4.6 | Concurrency tests | 4.2, 4.3 | Planned |
| 4.7 | Partial indexes and retry-friendly conflict responses | 4.2, 4.3 | Planned |
| 4.8 | Seat update stream or documented polling trade-off | 4.5 | Planned |

Detailed tasks: [Phase 4](phases/phase-04-seat-hold-and-reservation.md)

## Phase 5 - Payment Flow And Events

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 5.1 | Mock payment provider boundary | 2.4, 4.2 | Planned |
| 5.2 | Payment intent schema | 5.1 | Planned |
| 5.3 | Webhook HMAC verification | 5.2 | Planned |
| 5.4 | Webhook idempotency | 5.3 | Planned |
| 5.5 | Emit payment completed/failed events | 5.4 | Planned |
| 5.6 | Reserve or release seat from events | 5.5 | Planned |
| 5.7 | Saga retry and compensation documentation | 5.6 | Planned |
| 5.8 | Webhook inbox/outbox or documented scoped alternative | 5.4, 5.7 | Planned |

Detailed tasks: [Phase 5](phases/phase-05-payment-flow-and-events.md)

## Phase 6 - Public UI And End-To-End Flow

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 6.1 | Choose UI stack | 1.1 | Planned |
| 6.2 | Implement login UI | 3.3 | Planned |
| 6.3 | Implement seat selection UI | 4.5 | Planned |
| 6.4 | Implement payment flow UI | 5.2 | Planned |
| 6.5 | Show final reservation state | 5.6 | Planned |
| 6.6 | UI error, conflict, and retry states | 4.7, 5.6 | Planned |

Detailed tasks: [Phase 6](phases/phase-06-public-ui-and-end-to-end-flow.md)

## Phase 7 - Ops, Tests, And Submission

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 7.1 | E2E happy path | 6.5 | Planned |
| 7.2 | Security and concurrency test pass | 3.6, 4.6, 5.4 | Planned |
| 7.3 | Per-service Dockerfiles | 2.5 | Planned |
| 7.4 | Compose full runtime | 7.3 | Planned |
| 7.5 | README and local runbook | 7.4 | Planned |
| 7.6 | Observability and production TODO pass | 7.4 | Planned |
| 7.7 | Evidence and final review | 7.5, 7.6 | Planned |

Detailed tasks: [Phase 7](phases/phase-07-ops-tests-and-submission.md)

## Phase 8 - Scoring And Quick Scan Closure

| # | Title | Depends on | Status |
| --- | --- | --- | --- |
| 8.1 | Run Quick Scan | 7.7 | Planned |
| 8.2 | Fill Scoring Guide final table | 8.1 | Planned |
| 8.3 | Verify no auto-fail items remain | 8.1 | Planned |
| 8.4 | Verify at least 3 exceed signals | 8.2 | Planned |
| 8.5 | Prepare submission zip and summary | 8.3, 8.4 | Planned |

Detailed tasks: [Phase 8](phases/phase-08-scoring-and-quick-scan-closure.md)
