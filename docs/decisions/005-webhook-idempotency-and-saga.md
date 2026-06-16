# 005 - Webhook Idempotency And Saga Compensation

## Decision

Payment webhooks require HMAC signature verification and timestamp freshness. `payment_webhook_events.event_id` is the idempotency key. The payment event then drives a Saga step:

- `payment.completed.v1` reserves the held seat.
- `payment.failed.v1` releases the held seat.
- Duplicate events are no-ops in `seat-service`.

## Rationale

This protects the payment boundary from forged provider calls and makes retries safe. Compensation is explicit when payment fails.

## Trade-Off

The implementation uses a webhook inbox plus idempotent publish, not a full transactional outbox. A production outbox would close the gap between database commit and RabbitMQ publish.

## Status

Accepted.
