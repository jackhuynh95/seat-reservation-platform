# Phase 5 - Payment Flow And Events

## Goal

Implement mock payment completion and event-driven reservation.

## Tasks

| ID | Task | Output | Status |
| --- | --- | --- | --- |
| 5.1.1 | Define payment provider interface | Payment service | Planned |
| 5.2.1 | Add payment intent schema | Migration | Planned |
| 5.3.1 | Verify webhook HMAC | Payment API | Planned |
| 5.3.2 | Reject stale webhook timestamps | Payment API | Planned |
| 5.4.1 | Store webhook event IDs | Webhook inbox | Planned |
| 5.4.2 | Ignore duplicate webhook events | Payment service | Planned |
| 5.5.1 | Publish `payment.completed` | RabbitMQ event | Planned |
| 5.5.2 | Publish `payment.failed` | RabbitMQ event | Planned |
| 5.6.1 | Reserve seat on payment completed | Consumer | Planned |
| 5.6.2 | Release hold on payment failed | Consumer | Planned |
| 5.6.3 | Release hold on payment timeout | Sweeper or event | Planned |
| 5.7.1 | Add Saga decision record | `docs/decisions/` | Planned |
| 5.7.2 | Add retry/dead-letter path | Consumer/broker config or documented shortcut | Planned |
| 5.7.3 | Test duplicate payment event | Integration test | Planned |
| 5.7.4 | Test payment failure compensation | Integration test | Planned |

## Exit Criteria

- Payment completion reserves a seat through an async event.
- Payment failure releases the hold.
- Payment timeout or abandonment releases the hold.
- Duplicate webhook events are safe.
- Saga/compensation behavior is documented and tested.
