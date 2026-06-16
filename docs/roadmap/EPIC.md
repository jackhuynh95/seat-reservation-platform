# Epic Vision

## Epic

Build a microservices TypeScript seat reservation platform that lets authenticated users reserve one of three seats after mock payment completion.

## Success Criteria

The project is successful when:

- auth, seat reservation, and payment are separate services;
- services communicate business completion through RabbitMQ or Kafka events;
- users can log in with 90-day refresh session support;
- users can hold one of three seats;
- concurrent holds are safe and exactly one request wins;
- mock payment completion reserves the seat;
- duplicate payment events are idempotent;
- payment failure releases the seat;
- local setup is documented and runnable;
- decisions and trade-offs are documented.

## Non-Goals Unless Approved

- Real payment provider integration.
- Production Kubernetes deployment.
- Complex user registration and profile management.
- Multi-event seating maps.
- Advanced admin dashboard.

## Reviewer Story

As a reviewer, I can:

- read the architecture docs;
- start local infrastructure;
- run the services;
- execute the login to hold to payment to reservation flow;
- inspect tests and decision records;
- understand why each service boundary exists.
