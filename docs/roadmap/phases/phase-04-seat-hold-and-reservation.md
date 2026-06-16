# Phase 4 - Seat Hold And Reservation

## Goal

Implement the seat availability and hold model correctly under concurrency.

## Tasks

| ID | Task | Output | Status |
| --- | --- | --- | --- |
| 4.1.1 | Add seat schema | Migration | Planned |
| 4.1.2 | Seed 3 seats | Seed script | Planned |
| 4.2.1 | Implement atomic hold | Seat service | Planned |
| 4.3.1 | Enforce one hold per user | DB invariant | Planned |
| 4.3.2 | Enforce one active hold per seat | DB invariant or row lock | Planned |
| 4.4.1 | Add hold expiry cleanup | Sweeper or lazy cleanup | Planned |
| 4.5.1 | Add seat list endpoint | Seat API | Planned |
| 4.5.2 | Add hold endpoint | Seat API | Planned |
| 4.6.1 | Test two concurrent holds where one wins | Integration test | Planned |
| 4.6.2 | Test duplicate hold by same user | Integration test | Planned |

## Exit Criteria

- Users can see 3 seats.
- A user can hold a seat.
- Concurrent hold correctness is proven.
