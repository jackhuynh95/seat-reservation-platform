# 006 - Local Runtime And Production Follow-Ups

## Decision

Use Docker Compose for local review with Postgres, RabbitMQ, Redis, gateway, auth, seat, payment, worker, and web.

## Rationale

The reviewer can run the full system with one command and exercise the required login -> hold -> payment -> reservation flow.

## Production Follow-Ups

- Replace demo secrets from `.env.example`.
- Use per-service database credentials or separate databases.
- Replace in-memory gateway rate limiting with Redis-backed distributed limiting.
- Add a transactional outbox publisher for payment events.
- Add structured log shipping and metrics.

## Status

Accepted.
