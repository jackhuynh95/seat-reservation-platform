# AGENTS.md

## Project Intent

This repository is for the `location-booking-api` assignment. Treat the project as a RESTful backend for hierarchical building location management and room booking validation.

## Current Phase

The project is in the specification and harness phase.

Do not generate the application codebase, NestJS scaffold, Docker files, or CI files until the user explicitly asks for that step.

## Source of Truth

Use these documents before implementation decisions:

- `docs/specs/assignment-brief.md`
- `docs/specs/functional-spec.md`
- `docs/architecture/architecture-notes.md`
- `docs/guardrails/development-guardrails.md`
- `docs/development/project-structure.md`
- `docs/development/local-development-harness.md`
- `docs/operations/docker-compose.md`
- `docs/operations/runtime-packaging.md`
- `docs/roadmap/IMPLEMENTATION_ROADMAP.md`
- `docs/roadmap/EPIC.md`

## Repository Layout

This repository follows a small monorepo shape inspired by the user's larger Medusa harness:

- `apps/server`: future NestJS API service.
- `apps/admin`: future admin UI or API testing console if approved.
- `docs`: specs, architecture, operations, decisions, and guardrails.
- `docker-compose.yml`: local infrastructure only until app containers are approved.

## Required Stack

- Node.js
- NestJS
- TypeScript
- TypeORM
- PostgreSQL

## Implementation Guardrails

- Treat backend and admin skill lookup as a required implementation preflight.
- Before implementing or modifying backend code in `apps/server`, invoke and mention the `nestjs-expert` skill if it is available in the active agent environment.
- If `nestjs-expert` is not installed or not discoverable, state that clearly, then continue with the documented NestJS/TypeORM guardrails.
- Before implementing or modifying admin UI code in `apps/admin`, invoke and mention the `react-best-practices` skill if it is available in the active agent environment.
- If `react-best-practices` is not installed or not discoverable, state that clearly, then continue with the documented frontend guardrails.
- Prefer clear module boundaries: locations, bookings, shared database configuration, logging, and exception handling.
- Keep domain rules testable outside controllers.
- Preserve the location hierarchy as a first-class model.
- Do not hard-code sample data into business logic.
- Document assumptions when assignment details are incomplete.
- Keep generated structure minimal and explainable.
- Treat `apps/server` and `apps/admin` as independent app roots.
- Eventual delivery should package both apps by building `apps/admin` to static assets and serving those assets from the NestJS server.
- The production runtime should be a Docker container for the NestJS server, with static admin assets included in the server image and PostgreSQL provided as an external service.
- Do not copy Medusa-specific architecture, services, credentials, or scripts into this project.
- Keep `docker-compose.yml` focused on local development infrastructure until service Dockerfiles exist.
- Follow the roadmap phases in `docs/roadmap/IMPLEMENTATION_ROADMAP.md`; do not skip into later phases unless the user explicitly asks.

## Shell Rule

Follow the global shell rule from `/Users/jackhuynh/.codex/RTK.md`: run shell commands through `rtk`.
