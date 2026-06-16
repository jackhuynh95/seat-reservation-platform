# 001 - Workspace And NestJS Service Shape

## Decision

Use npm workspaces with one NestJS app per runtime service:

- `apps/gateway`
- `apps/auth-service`
- `apps/seat-service`
- `apps/payment-service`
- `apps/payment-worker`
- `apps/web`

Shared contracts and helpers live in `packages/`.

## Rationale

This keeps auth, seat, and payment ownership separate and avoids the monolith auto-fail. npm workspaces are enough for this assessment and avoid extra package-manager setup.

## Trade-Off

All services share one Postgres instance locally, but each service owns its own tables. A production split could use separate databases or schemas per service.

## Status

Accepted.
