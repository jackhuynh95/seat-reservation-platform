# Saga And Compensation

## Purpose

Seat reservation crosses service boundaries:

- `seat-service` owns holds and reservations.
- `payment-service` owns payment intents and webhook verification.
- RabbitMQ carries payment completion/failure events.

Because no single service owns the whole transaction, use a Saga-style workflow with explicit compensation.

## Saga Participants

| Participant | Responsibility |
| --- | --- |
| `seat-service` | Create hold, reserve seat, release hold |
| `payment-service` | Create payment intent, verify webhook, publish payment events |
| `payment-worker` or seat consumer | Consume payment events and apply reservation/compensation |
| RabbitMQ | Deliver async events with retry/dead-letter support |

## Happy Path

```text
User
  -> gateway
  -> seat-service: hold seat
  -> payment-service: create payment intent
  -> payment-service: verified payment completed webhook
  -> RabbitMQ: payment.completed
  -> seat-service consumer: reserve held seat
  -> client sees reservation complete
```

## Compensation Paths

### Payment Failed

```text
payment-service
  -> RabbitMQ: payment.failed
  -> seat-service consumer: release hold
```

### Payment Abandoned Or Timeout

```text
seat-service sweeper
  -> finds expired hold
  -> releases hold
```

### Duplicate Webhook

```text
payment-service
  -> checks webhook inbox/event ID
  -> duplicate event is no-op
```

### Consumer Failure

```text
consumer fails
  -> message retry
  -> after max attempts, dead-letter queue/state
  -> operator can inspect and replay
```

## Idempotency Requirements

- Webhook event IDs must be unique.
- Saga step processing should record processed event IDs per consumer.
- Reserving an already reserved seat for the same payment should be a no-op.
- Releasing an already released hold should be a no-op.

## Outbox / Inbox Direction

Recommended implementation:

- `payment-service` stores verified webhook in a webhook inbox.
- `payment-service` writes outgoing event to an outbox in the same transaction as payment status update.
- outbox worker publishes to RabbitMQ.
- consumers record processed event IDs.

If full outbox is scoped down for time, document the shortcut in `docs/decisions/` and keep webhook idempotency plus consumer idempotency.

## Events

Candidate event contracts:

- `payment.completed.v1`
- `payment.failed.v1`
- `seat.reserved.v1`
- `seat.hold.released.v1`

Each event should include:

- `eventId`
- `eventType`
- `occurredAt`
- `correlationId`
- `paymentIntentId`
- `seatId`
- `holdId`
- `userId`

## Done Criteria

- Payment completion reserves the seat through an async event.
- Payment failure releases the hold.
- Abandoned payment eventually releases the hold.
- Duplicate payment events do not duplicate reservations.
- Failed event handling is retryable or documented with a production follow-up.
