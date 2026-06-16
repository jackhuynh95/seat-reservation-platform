# Phase 1 - Monorepo And Infrastructure Foundation

## Goal

Prepare the workspace and local infrastructure before service scaffolding.

## Tasks

| ID | Task | Output | Status |
| --- | --- | --- | --- |
| 1.1.1 | Choose package manager | Decision record | Planned |
| 1.1.2 | Choose workspace tool | Decision record | Planned |
| 1.2.1 | Define `apps/` roots | Docs and folders | Planned |
| 1.2.2 | Define `packages/` shared contract roots | Docs and folders | Planned |
| 1.2.3 | Define `infra/` roots | Docs and folders | Planned |
| 1.3.1 | Validate Compose infrastructure | `docker compose config` | Planned |
| 1.4.1 | Define `.env.example` | Environment template | Planned |
| 1.5.1 | Add microservices decision record | `docs/decisions/` | Planned |
| 1.5.2 | Add scaling-profile decision record | `docs/decisions/` | Planned |
| 1.6.1 | Add shared strict TypeScript config | `tsconfig.base.json` | Planned |
| 1.6.2 | Add workspace lint/format conventions | Root config | Planned |
| 1.7.1 | Define migration naming convention | Docs/decision | Planned |
| 1.7.2 | Define DB pool sizing convention | Docs/decision | Planned |
| 1.7.3 | Add Postgres slow-query/log-lock-waits plan | Compose or docs | Planned |

## Exit Criteria

- App/service roots are agreed.
- Local infra is ready.
- Strict TypeScript baseline is agreed.
- Database migration and pool conventions are documented.
- No service implementation exists yet.
