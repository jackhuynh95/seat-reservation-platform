# 003 - Seat Hold Locking And Indexes

## Decision

Use PostgreSQL row locks plus partial unique indexes:

- `select ... for update` on the target seat row.
- Serializable transaction for hold creation.
- Unique partial index for one active hold per seat.
- Unique partial index for one active hold per user.
- Expiry sweeper uses `for update skip locked` with a batch limit.

## Rationale

Application-only checks are not safe under concurrent holds. Row locks and database constraints make exactly-one-winner behavior enforceable by Postgres.

## Trade-Off

The hold invariant is represented with `status = 'held'`; expiry must run before a new hold can reuse the seat/user. This keeps the model simple and reviewable.

## Status

Accepted.
