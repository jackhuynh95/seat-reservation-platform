# seat-reservation-platform

TypeScript seat reservation platform with authentication, 90-day sessions, seat selection, mock payment flow, and reservation completion after payment.

## Status

This repository is in the documentation and implementation-planning phase.

The assessment and review checklist require a microservices design, so application code should not be generated until the service boundaries, broker flow, security model, and concurrency strategy are documented.

## Target Shape

- `auth-service`: login, refresh sessions, logout, session security.
- `seat-service`: seat availability, hold, reservation, concurrency control.
- `payment-service`: mock payment intent and webhook handling.
- `gateway`: public API entry point for the client.
- `web`: optional public UI.
- `packages`: shared TypeScript types, event contracts, logger/config helpers.
- `infra`: broker, database, nginx, and deployment configuration.

## Working Docs

- [Assignment Brief](docs/specs/assignment-brief.md)
- [Functional Specification](docs/specs/functional-spec.md)
- [Review Checklist Map](docs/review/review-checklist-map.md)
- [Common Best Practices](docs/review/common-best-practices.md)
- [Scoring Guide](docs/review/scoring-guide.md)
- [Quick Scan](docs/review/quick-scan.md)
- [Architecture Notes](docs/architecture/architecture-notes.md)
- [Saga And Compensation](docs/architecture/saga-compensation.md)
- [Development Guardrails](docs/guardrails/development-guardrails.md)
- [Project Structure](docs/development/project-structure.md)
- [Implementation Roadmap](docs/roadmap/IMPLEMENTATION_ROADMAP.md)
- [Epic Vision](docs/roadmap/EPIC.md)
- [Docker Compose Notes](docs/operations/docker-compose.md)
- [Decisions](docs/decisions/README.md)
