# Manual Test Evidence

Reviewer-facing evidence for the local Docker run of `seat-reservation-platform`.

## Manual Test Log

| Date | Tester | Environment | Summary |
| --- | --- | --- | --- |
| 2026-06-16 | Codex | Local Docker runtime, web at `http://localhost:5173`, gateway at `http://localhost:3000` | Captured runtime, architecture, login/session, 3-seat availability, hold, mock payment, reservation completion, and reserved-seat conflict evidence. |

## Functional Requirement Evidence

| # | Requirement | What Was Captured | Expected Result | Screenshot | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Runtime proof | `docker compose ps` plus service health checks | Gateway, Auth, Seat, Payment, Payment Worker, Web, Postgres, RabbitMQ, and Redis are running; health endpoints return `{"ok":true}` | [screenshots/2026-06-16-01-docker-runtime.png](screenshots/2026-06-16-01-docker-runtime.png) | Pass |
| 2 | Architecture proof | Rendered system diagram from `SYSTEM_DIAGRAM.png`; source text remains in [`../../SYSTEM_DIAGRAM.txt`](../../SYSTEM_DIAGRAM.txt) | Browser uses Web UI through Gateway; services stay separate; payment events flow through RabbitMQ to worker and Seat Service | [screenshots/2026-06-16-02-system-diagram.png](screenshots/2026-06-16-02-system-diagram.png) | Pass |
| 3 | Login/session | Web UI login screen with demo credentials | User can start authenticated flow from local web container | [screenshots/2026-06-16-03-login.png](screenshots/2026-06-16-03-login.png) | Pass |
| 4 | 3-seat availability | Logged-in UI after `Refresh Seats` | Three seeded seats are visible with current statuses | [screenshots/2026-06-16-04-seat-availability.png](screenshots/2026-06-16-04-seat-availability.png) | Pass |
| 5 | Seat hold | Held `A3` from the UI | Selected available seat changes to `held`; hold button becomes disabled | [screenshots/2026-06-16-05-seat-hold-success.png](screenshots/2026-06-16-05-seat-hold-success.png) | Pass |
| 6 | Mock payment initiation | UI after `Create Payment` | Payment intent is created for held seat | [screenshots/2026-06-16-06-payment-initiation.png](screenshots/2026-06-16-06-payment-initiation.png) | Pass |
| 7 | Payment completion and reservation | UI after `Mock Pay` and worker processing | Payment completion queues event; Seat Service shows `A3` as `reserved` | [screenshots/2026-06-16-07-payment-completion-reserved.png](screenshots/2026-06-16-07-payment-completion-reserved.png) | Pass |
| 8 | Reserved-seat conflict | Gateway response after attempting to hold already-reserved `A1` | API rejects second hold with HTTP `409` and `Seat is not available` | [screenshots/2026-06-16-08-conflict-or-compensation.png](screenshots/2026-06-16-08-conflict-or-compensation.png) | Pass |

## Runtime Proof

Captured `docker compose ps` shows 9 running services:

- `seat-reservation-gateway`
- `seat-reservation-auth`
- `seat-reservation-seat`
- `seat-reservation-payment`
- `seat-reservation-worker`
- `seat-reservation-web`
- `seat-reservation-postgres` with Docker health `healthy`
- `seat-reservation-rabbitmq` with Docker health `healthy`
- `seat-reservation-redis` with Docker health `healthy`

Health checks captured:

```text
http://localhost:3000/health/live {"ok":true}
http://localhost:3000/health/ready {"ok":true}
http://localhost:3001/health/ready {"ok":true}
http://localhost:3002/health/ready {"ok":true}
http://localhost:3003/health/ready {"ok":true}
http://localhost:3004/health/ready {"ok":true}
```

## Architecture Evidence

`SYSTEM_DIAGRAM.txt` remains at repo root and is linked above. Rendered architecture screenshot proves:

- Browser traffic enters through Gateway.
- Auth, Seat, Payment, and Payment Worker are separate services.
- Payment completion/failure uses RabbitMQ events.
- Seat Service owns final hold/reservation state.

## Core Flow Summary

1. Opened `http://localhost:5173`.
2. Logged in with demo account.
3. Refreshed seat availability and verified 3 seeded seats.
4. Held available seat `A3`.
5. Created mock payment intent.
6. Completed mock payment.
7. Waited for RabbitMQ/Payment Worker flow to update Seat Service.
8. Verified `A3` became `reserved`.
9. Attempted to hold reserved `A1`; Gateway returned HTTP `409`.
