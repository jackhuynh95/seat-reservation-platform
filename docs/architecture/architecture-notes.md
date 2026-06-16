# Architecture Notes

## Architecture Direction

Use a TypeScript microservices architecture.

Preferred backend framework:

- NestJS per service.

Preferred broker:

- RabbitMQ for local implementation speed and clear async event flow.

Preferred database:

- PostgreSQL.

Optional cache/rate-limit store:

- Redis.

## Planned Service Boundaries

```text
client
  -> gateway
      -> auth-service
      -> seat-service
      -> payment-service

payment-service
  -> RabbitMQ payment.completed/payment.failed
      -> seat-service consumer or payment-worker
```

## Saga Direction

Use a Saga-style workflow for the payment-to-reservation process.

Primary path:

1. `seat-service` creates a hold.
2. `payment-service` creates a mock payment intent for that hold.
3. `payment-service` verifies payment webhook.
4. `payment-service` records webhook idempotency.
5. `payment-service` publishes `payment.completed`.
6. `seat-service` consumes `payment.completed` and reserves the held seat.

Compensation paths:

- `payment.failed` releases the held seat.
- hold expiry releases the held seat if checkout is abandoned.
- duplicate `payment.completed` is ignored.
- failed consumers retry, then move to a dead-letter state or queue.

See [Saga And Compensation](saga-compensation.md).

## Service Responsibilities

### Gateway

- Public HTTP entry point.
- CORS and security headers.
- Rate limiting.
- Request correlation ID.
- Route traffic to internal services.

### Auth Service

- User login.
- Access token issuing.
- 90-day refresh session through httpOnly cookie.
- Refresh token rotation and revocation.
- Logout and logout-all.

### Seat Service

- Store 3 seats.
- List seats.
- Hold seat atomically.
- Enforce one hold per user.
- Release expired holds.
- Reserve seat after payment completion event.

### Payment Service

- Create mock payment intent.
- Verify webhook HMAC.
- Store webhook inbox or idempotency key.
- Emit payment completion/failure events.

### Payment Worker

- Optional worker for async event handling and retry.
- Can process outbox/inbox messages.

## Initial Data

Seed 3 seats:

- `A1`
- `A2`
- `A3`

## Key Design Constraints

- No monolith.
- No sync-only HTTP service choreography for business completion.
- Critical state transitions must be transactionally safe.
- Payment event processing must be idempotent.
- Payment-to-reservation must use Saga/compensation semantics.
- All trade-offs must be documented.
