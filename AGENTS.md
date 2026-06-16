# AGENTS.md

## Project Intent

This repository is for the `seat-reservation-platform` technical assessment. Treat the project as a TypeScript microservices seat reservation platform with authentication, seat holding/reservation, and mock payment completion.

## Current Phase

The project is in the specification and harness phase.

Do not generate application service code, NestJS scaffolds, Dockerfiles, or CI files until the user explicitly asks for that implementation step.

## Source of Truth

Use these documents before implementation decisions:

- `docs/specs/assignment-brief.md`
- `docs/specs/functional-spec.md`
- `docs/review/review-checklist-map.md`
- `docs/architecture/architecture-notes.md`
- `docs/architecture/saga-compensation.md`
- `docs/guardrails/development-guardrails.md`
- `docs/development/project-structure.md`
- `docs/operations/docker-compose.md`
- `docs/roadmap/IMPLEMENTATION_ROADMAP.md`
- `docs/roadmap/EPIC.md`

## Planned Repository Layout

- `apps/gateway`: public API gateway.
- `apps/auth-service`: authentication and session service.
- `apps/seat-service`: seat hold and reservation service.
- `apps/payment-service`: mock payment service and webhook boundary.
- `apps/payment-worker`: optional async consumer for payment events.
- `apps/web`: optional public UI.
- `packages`: shared contracts and utilities.
- `infra`: nginx, broker, database, and deployment configuration.
- `docs`: specs, architecture, operations, decisions, review mapping, and roadmap.

## Required Stack

- TypeScript.
- Node.js runtime.
- Microservices architecture.
- Kafka or RabbitMQ message broker.
- PostgreSQL.
- Redis if used for rate limiting, sessions, or caching.

Preferred implementation stack unless the user changes it:

- NestJS for backend services.
- React for public UI, if UI is implemented.

## Auto-Fail Guardrails

- Do not collapse auth, seat-reservation, and payment into one process.
- Do not use only HTTP sync calls between services for business events.
- Include Kafka or RabbitMQ for inter-service events.
- Do not put refresh tokens in JSON response bodies or localStorage.
- Do not use weak password hashing.
- Do not add hardcoded secret defaults.
- Do not skip webhook HMAC verification.
- Do not skip `docs/decisions/` entries for major trade-offs.

## Implementation Guardrails

- Before backend service work, invoke and mention `nestjs-expert` if it is available.
- If `nestjs-expert` is unavailable, state that clearly, then continue with local NestJS and microservices guardrails.
- Before React UI work, invoke and mention `react-best-practices` if it is available.
- If `react-best-practices` is unavailable, state that clearly, then continue with local frontend guardrails.
- Keep service boundaries explicit and independently deployable.
- Use shared packages only for contracts/utilities; services must not import each other's application code.
- Treat broker events as versioned contracts.
- Use Saga/compensation for payment-to-reservation workflows.
- Payment failure, payment timeout, duplicate webhook, and consumer retry paths must be documented before implementation.
- Record shortcuts and production trade-offs in `docs/decisions/`.
- Follow the roadmap phases in `docs/roadmap/IMPLEMENTATION_ROADMAP.md`; do not skip into later phases unless the user explicitly asks.

## Shell Rule

Follow the global shell rule from `/Users/jackhuynh/.codex/RTK.md`: run shell commands through `rtk`.
