# Docker Compose Notes

## Current Purpose

`docker-compose.yml` currently provides local infrastructure only.

Services:

- PostgreSQL
- RabbitMQ
- Redis

Application services should be added only after implementation begins.

## Local Infrastructure

Start infrastructure:

```bash
docker compose up -d postgres rabbitmq redis
```

Check status:

```bash
docker compose ps
```

Stop:

```bash
docker compose down
```

Reset local data:

```bash
docker compose down -v
```

## Ports

| Service | Port | Purpose |
| --- | --- | --- |
| PostgreSQL | `5432` | Database |
| RabbitMQ | `5672` | AMQP broker |
| RabbitMQ Management | `15672` | Browser management UI |
| Redis | `6379` | Rate limit/cache/session support |

## Local Credentials

PostgreSQL:

- user: `seat_reservation`
- password: `seat_reservation`
- database: `seat_reservation`

RabbitMQ:

- user: `seat_reservation`
- password: `seat_reservation`

These are local-only defaults.
