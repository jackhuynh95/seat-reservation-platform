# Common Best Practices

This document captures the top section of the review checklist so the project does not only satisfy the obvious microservices requirement.

## 1.0 Microservices Architecture

| Checklist Item | Project Target |
| --- | --- |
| Separate bounded contexts | `auth-service`, `seat-service`, and `payment-service` are separate app roots |
| Independent deployment | Each service gets its own entry point, port, Dockerfile, and health endpoints |
| Message broker | RabbitMQ or Kafka is required for inter-service business events |
| Independent scaling | Service scaling profile is documented in decision records |
| Shared code | Shared contracts/utilities live in `packages/`, not copied across services |
| Health endpoints | Each service exposes liveness and readiness endpoints |

## 1.1 Code Structure And Best Practices

| Checklist Item | Project Target |
| --- | --- |
| Monorepo layout | Use `apps/`, `packages/`, and `infra/` |
| Service-boundary reasons | Document why each service exists in `docs/decisions/` |
| README architecture | README should include service list, ports, and a flow diagram or link |
| Trade-offs | Record shortcuts and implementation choices in `docs/decisions/` |
| TODO markers | Use `TODO(prod)`, `TODO(scale)`, `TODO(security)`, and `TODO(ops)` for scoped shortcuts |
| TypeScript strict mode | Enable `"strict": true` for services and shared packages |
| Input validation | Validate requests at API boundaries; reject/strip unknown fields |
| Structured logging | Log JSON with `action`, `userId` when available, `traceId`, and `correlationId` |
| E2E happy path | Test login to hold to payment to reserve |

## 1.2 Database

| Checklist Item | Project Target |
| --- | --- |
| Migrations | Use versioned migration files for every service-owned schema |
| Partial indexes | Add partial indexes for hot queries like `WHERE status = 'HELD'` |
| Backward compatibility | Prefer expand-contract migrations; document any breaking migration |
| Connection pool | Configure pool size explicitly per service |
| Slow query logging | Configure slow query and lock-wait visibility for local/prod notes |

## 1.3 Testing

| Checklist Item | Project Target |
| --- | --- |
| Concurrent hold test | Two concurrent hold attempts result in exactly one success |
| Integration tests | Auth, hold, and payment flows are tested against realistic dependencies |
| Idempotency tests | Duplicate payment/webhook/hold requests do not duplicate state |

## Implementation Notes

- These items should appear in roadmap goals, not only final polish.
- If a best-practice item is scoped down, document the reason in `docs/decisions/`.
- Use [Quick Scan](quick-scan.md) near the end to verify evidence exists.
