# Review Checklist Map

This file summarizes the provided review checklist into project planning requirements.

For scoring targets, use [Scoring Guide](scoring-guide.md).

For the top-level common best-practice checklist, use [Common Best Practices](common-best-practices.md).

For the 5-minute pre-submit audit, use [Quick Scan](quick-scan.md).

## Auto-Fail Gates

These are mandatory.

| Area | Requirement | Project Response |
| --- | --- | --- |
| Microservices | `auth`, `seat-reservation`, and `payment` must be separate services | Plan separate app roots and Dockerfiles |
| Broker | Kafka or RabbitMQ required for async inter-service events | Use RabbitMQ by default unless changed |
| Refresh token storage | No refresh token in JSON body or localStorage | Use httpOnly cookie |
| Password hashing | Must use Argon2id | Auth service must use Argon2id |
| Secrets | No hardcoded secret defaults | Config must fail fast when secrets are missing |
| Webhook | HMAC verification required | Payment service must verify webhook signatures |
| Compensation | Payment failure must release the seat | Use Saga compensation from payment event to hold release |
| CORS | No wildcard CORS with credentials | Gateway must use origin allowlist |
| E2E | Happy path must run | Add smoke/e2e script |
| Decisions | `DECISIONS.md` or decision docs required | Use `docs/decisions/` |

## Target Services

| Service | Responsibility | Scaling Profile |
| --- | --- | --- |
| `gateway` | Public API entry point, rate limit, request correlation | Network/API edge |
| `auth-service` | login, refresh, logout, session security | CPU-bound because password hashing |
| `seat-service` | seat state, hold, reservation, concurrency | DB-bound because locking and hot rows |
| `payment-service` | mock payment intent and webhook verification | I/O-bound because external payment boundary |
| `payment-worker` | async payment event consumer, compensation | I/O/background worker |
| `web` | public UI | Static/frontend |

## Broker Events

Candidate RabbitMQ events:

- `payment.completed`
- `payment.failed`
- `seat.hold.created`
- `seat.hold.expired`
- `seat.reserved`
- `seat.hold.released`

## Meet Expectation Focus

- Microservices layout.
- RabbitMQ in Compose.
- Independent Dockerfiles and ports.
- Per-service health endpoints.
- Clear monorepo layout with `apps/`, `packages/`, and `infra/`.
- TypeScript strict mode.
- API input validation.
- Structured JSON logs with correlation ID.
- Versioned migrations.
- Partial indexes for hot status-filtered queries.
- Auth session security.
- Atomic seat hold.
- Database invariant for concurrency.
- Integration and idempotency tests.
- Payment idempotency.
- HMAC webhook verification.
- Saga compensation for payment failure and timeout.
- Decision records for trade-offs.

## Exceed Expectation Candidates

- Transactional outbox.
- Webhook inbox.
- Saga compensation with retry/dead-letter handling.
- Reuse detection for refresh token families.
- Redis-backed rate limiting.
- SSE endpoint for seat updates.
- `Retry-After` on 409/429 responses.
- Graceful shutdown per service.
- Structured JSON logs with correlation IDs.

## Quick Scan Requirement

Before final submission, run the checks in [Quick Scan](quick-scan.md) and record any gaps in `docs/decisions/` or the final evidence notes.

## Scoring Guide Requirement

Before final submission, compare the implementation against [Scoring Guide](scoring-guide.md). The target is:

- no auto-fail items;
- meet expectation for architecture, security, concurrency, ops, finance handling, and decisions;
- at least 3 exceed-expectation judgment signals where feasible.
