# Reviewer Runbook

## Start

```bash
docker compose up --build
```

Open:

- API gateway: `http://localhost:3000`
- Web UI: `http://localhost:5173`
- RabbitMQ UI: `http://localhost:15672` (`seat_reservation` / `seat_reservation`)

Demo login:

- email: `demo@example.com`
- password: `Password123!`

## Happy Path

1. Log in.
2. Refresh seats.
3. Hold an available seat.
4. Create payment.
5. Mock pay.
6. Refresh seats and verify selected seat becomes `reserved`.

## Checks

```bash
npm run lint
npm test
npm run build
LIVE_E2E=1 npm run test:e2e
```

Use `LIVE_E2E=1` after Compose is running.

## Notes

`npm audit` currently reports transitive dependency issues in the local toolchain. No direct runtime secret fallback or unsigned webhook path is used.
