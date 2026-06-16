# Development Guardrails

## Current Phase

This repository is in the documentation and planning phase.

Allowed now:

- specs;
- architecture notes;
- review checklist mapping;
- roadmap;
- decision records;
- local infrastructure planning.

Blocked until explicit implementation approval:

- service scaffolding;
- Dockerfile generation;
- application code;
- CI setup.

## Required Preflights

Before backend service implementation:

- invoke and mention `nestjs-expert` if available;
- if unavailable, state that clearly and continue with local NestJS guardrails.

Before React UI implementation:

- invoke and mention `react-best-practices` if available;
- if unavailable, state that clearly and continue with frontend guardrails.

## Architecture Guardrails

- Keep `auth-service`, `seat-service`, and `payment-service` separate.
- Use RabbitMQ or Kafka for inter-service events.
- Do not implement a single-process backend.
- Do not let services import each other's application code.
- Put shared contracts in `packages`.
- Version event contracts.
- Add a decision record for every major shortcut.
- Keep monorepo roots explicit: `apps/`, `packages/`, and `infra/`.

## Security Guardrails

- Store refresh token in httpOnly cookie.
- Use opaque refresh tokens, hashed in storage.
- Rotate refresh tokens.
- Use Argon2id for password hashing.
- Fail fast when required secrets are missing.
- Verify webhook HMAC signatures.
- Use explicit CORS allowlist.

## Concurrency Guardrails

- Hold operation must be atomic.
- Enforce correctness at DB level or through explicit row lock.
- Add test for two concurrent hold attempts where exactly one wins.
- Enforce one hold per user.
- Expired holds must be released.

## Code Quality Guardrails

- Use TypeScript strict mode.
- Validate all external inputs at API boundaries.
- Strip unknown request fields.
- Use structured JSON logs.
- Propagate correlation/request ID across gateway, services, and broker messages.
- Mark scoped shortcuts with `TODO(prod)`, `TODO(scale)`, `TODO(security)`, or `TODO(ops)`.

## Database Guardrails

- Use versioned migrations.
- Prefer backward-compatible migration style.
- Add partial indexes for hot status-filtered queries such as held seats.
- Configure database connection pool size explicitly.
- Enable slow query and lock-wait logging in local Postgres config where practical.

## Testing Guardrails

- Add E2E happy path: login to hold to payment to reservation.
- Add real-DB concurrency test where two requests race and exactly one wins.
- Add integration tests for auth, hold, and payment flows.
- Add idempotency tests for duplicate hold/payment/webhook paths.

## Payment Guardrails

- Payment amount must be server-controlled.
- Webhook processing must be idempotent.
- Payment failure must release the seat.
- Duplicate payment events must be no-op.

## Saga / Compensation Guardrails

- Treat payment-to-reservation as a Saga.
- Completion and compensation steps must be idempotent.
- Payment failure must release the hold.
- Payment timeout or abandoned checkout must eventually release the hold.
- Failed event handling must have retry or a documented dead-letter path.
- If transactional outbox is not implemented, document why and keep inbox/consumer idempotency.
