# Scoring Guide

Use this guide to steer implementation and final review.

## Target

Primary target:

- Meet Expectation with no auto-fail items.

Stretch target:

- Exceed Expectation by adding at least 3 judgment signals.

## Meet Expectation

The submission must satisfy all of these:

| Area | Required Signal |
| --- | --- |
| Auto-fail | No auto-fail item is triggered |
| Architecture | `auth-service`, `seat-service`, and `payment-service` are separate services |
| Architecture | Inter-service business communication uses RabbitMQ or Kafka |
| Security | At least 7 of 10 authentication/session items pass |
| Security | Refresh token cookie, Argon2id password hashing, and refresh rotation are mandatory |
| Concurrency | Seat hold operation is atomic |
| Concurrency | At least one DB-level invariant or explicit row lock protects hold correctness |
| Concurrency | Locking strategy is explained in `docs/decisions/` or code comments |
| Ops | `/health/live`, `/health/ready`, and graceful shutdown exist per service |
| Finance | Webhook HMAC verification exists |
| Finance | Webhook or event idempotency exists |
| Finance | Payment failure releases the held seat |
| Decisions | `docs/decisions/` has at least 5 real decision records |

## Exceed Expectation

Meet Expectation plus at least 3 judgment signals.

Good judgment signals:

| Signal | Why It Helps |
| --- | --- |
| Locking trade-off decision | Shows the candidate understands concurrency failure modes |
| `TODO(prod)` or `TODO(scale)` at scale boundaries | Shows production awareness without overbuilding |
| Replica-safe sweeper with batch limit or `SKIP LOCKED` | Shows awareness of multi-instance behavior |
| Refresh token family reuse detection | Shows security depth for stolen token scenarios |
| Separate access and refresh secrets | Reduces blast radius |
| SSE endpoint skeleton with Redis pub/sub follow-up | Shows real-time scaling awareness |
| Webhook ack-fast pattern | Avoids webhook timeout/retry storms |
| Outbox/inbox or documented compensation pattern | Shows reliability across service boundaries |
| `Retry-After` on 409/429 | Makes clients safer under contention and rate limits |
| Login timing equalization | Reduces user enumeration risk |

## Auto-Fail Items

Avoid these completely:

| Auto-Fail | Meaning |
| --- | --- |
| Monolith backend | Auth, seat reservation, and payment are not separate services |
| No broker | No RabbitMQ/Kafka for async inter-service events |
| Refresh token in JSON/localStorage | Refresh token is accessible to JavaScript |
| Weak password hashing | SHA, MD5, or bcrypt used instead of Argon2id |
| Hardcoded secret fallback | Example: `JWT_SECRET || "secret"` |
| No webhook HMAC verification | Anyone can fake payment events |
| Wildcard CORS with credentials | `origin: "*"` while cookies/auth are enabled |
| Broken E2E flow | Login to hold to payment to reserve cannot run |
| Missing decisions | No meaningful `docs/decisions/` records |

## Scoring Plan

Implementation should proceed in this order:

1. Avoid auto-fail architecture issues first.
2. Complete the happy path.
3. Add security and concurrency correctness.
4. Add payment idempotency and compensation.
5. Add ops readiness.
6. Add 3 or more exceed-expectation signals.
7. Run [Quick Scan](quick-scan.md).

## Final Scoring Notes

Record final scoring status here before submission:

| Category | Result | Evidence |
| --- | --- | --- |
| Auto-fail clear | Pass | Separate services, RabbitMQ, Argon2id, httpOnly refresh cookie, HMAC webhook |
| Meet architecture | Pass | Gateway/auth/seat/payment/worker/web are separate Docker runtimes |
| Meet security | Pass | Refresh rotation, hashed opaque refresh tokens, logout-all, audit logs, CORS allowlist |
| Meet concurrency | Pass | Seat hold uses transaction, row lock, and partial unique indexes |
| Meet ops | Pass | Compose runtime, per-service Dockerfiles, health endpoints, shutdown hooks |
| Meet finance | Pass | Server-controlled amount, HMAC webhook, idempotent webhook, payment failure compensation |
| Decisions count | Pass | 6 decision records in `docs/decisions/` |
| Exceed signal 1 | Pass | Locking trade-off decision and `SKIP LOCKED` sweeper |
| Exceed signal 2 | Pass | Refresh token family reuse detection |
| Exceed signal 3 | Pass | Webhook inbox/idempotency and documented outbox follow-up |
