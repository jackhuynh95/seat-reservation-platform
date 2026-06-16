# 002 - RabbitMQ For Payment Events

## Decision

Use RabbitMQ topic exchange `payment.events` with versioned routing keys:

- `payment.completed.v1`
- `payment.failed.v1`

`payment-worker` consumes these events and calls `seat-service` internal event endpoint.

## Rationale

Payment completion/failure must be asynchronous business communication. RabbitMQ is simpler than Kafka for this local assessment and supports durable queues, retries, and dead-letter routing.

## Trade-Off

The worker uses HTTP to apply the consumed event to `seat-service`. The business event still crosses services through RabbitMQ. A production version can move the consumer into `seat-service` or use service-specific queues with stronger replay tooling.

## Status

Accepted.
