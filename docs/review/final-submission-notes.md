# Final Submission Notes

## Summary

Implemented runnable TypeScript microservices seat reservation platform with gateway, auth, seat, payment, payment worker, web UI, Postgres, and RabbitMQ.

## Reviewer Flow

```bash
npm install
npm run lint
npm test
npm run build
docker compose up --build
LIVE_E2E=1 npm run test:e2e
```

Open `http://localhost:5173` and use:

- email: `demo@example.com`
- password: `Password123!`

## Meet-Expectation Evidence

- Auth, seat, and payment are separate services.
- RabbitMQ carries `payment.completed.v1` and `payment.failed.v1`.
- Refresh token stays in httpOnly cookie.
- Argon2id hashes passwords and refresh tokens.
- Payment webhook verifies HMAC and timestamp freshness.
- Seat hold uses DB transaction, row locks, and partial unique indexes.
- Payment failure releases held seats.
- All services expose live/ready health endpoints.
- Docker Compose runs full local system.
- Six decision records document trade-offs.

## Exceed Signals

- Refresh token family reuse detection.
- Replica-safe hold expiry sweeper with `SKIP LOCKED`.
- Webhook inbox/idempotency plus documented outbox follow-up.
- Dead-letter configured for payment event queue.
- Production TODO markers for scoped-down areas.

## Validation

Last run:

- `npm run lint`: pass.
- `npm test`: pass, with live tests skipped by default.
- `npm run build`: pass.
- `LIVE_E2E=1 npm run test:e2e`: pass with Compose running.

## Known Notes

`npm audit` reports transitive dependency vulnerabilities in the local dependency tree. This is documented as a follow-up; no hardcoded secret fallback or unsigned webhook path is used.
