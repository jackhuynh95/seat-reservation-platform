# Phase 2 - Service Baselines

## Goal

Create independently runnable service shells.

## Required Skill

Invoke and mention `nestjs-expert` before backend service work if available.

## Tasks

| ID | Task | Output | Status |
| --- | --- | --- | --- |
| 2.1.1 | Scaffold gateway | `apps/gateway` | Planned |
| 2.2.1 | Scaffold auth service | `apps/auth-service` | Planned |
| 2.3.1 | Scaffold seat service | `apps/seat-service` | Planned |
| 2.4.1 | Scaffold payment service | `apps/payment-service` | Planned |
| 2.5.1 | Add per-service `/health/live` | HTTP endpoint | Planned |
| 2.5.2 | Add per-service `/health/ready` | Dependency-aware endpoint | Planned |
| 2.6.1 | Add JSON logger | Shared package | Planned |
| 2.6.2 | Propagate correlation ID | Gateway and services | Planned |

## Exit Criteria

- Each service has an independent entry point.
- Each service can run separately.
- Each service has health endpoints.
