# Functional Specification

## Core User Flow

The platform must support this end-to-end flow:

1. User logs in.
2. User sees 3 seats.
3. User selects a seat.
4. System places a temporary hold on the seat.
5. User proceeds to payment.
6. Mock payment completes.
7. System reserves the held seat.

## Authentication

Users must be able to log in.

Session requirements:

- session expiry is 90 days;
- refresh token should be httpOnly cookie-based;
- refresh token should be opaque, hashed in storage, and rotated;
- access token should be short-lived;
- logout should revoke active session state.

## Seat Reservation

The platform must display 3 available seats.

Seat behavior:

- authenticated user can select a seat;
- selecting a seat creates a hold;
- a held seat cannot be held by another user;
- only one concurrent hold should win for the same seat;
- one user should not hold multiple seats at once;
- expired holds should be released;
- successful payment converts the hold to a reservation.

## Payment

Payment can be mocked, but it should use a clear provider boundary.

Payment behavior:

- create a payment intent for a held seat;
- payment amount must be server-controlled;
- payment completion should be event-driven;
- duplicate payment completion events should be idempotent;
- payment failure should release the held seat.

## Saga And Compensation

The reservation workflow should use a Saga-style process because it crosses service boundaries.

Required behavior:

- seat hold is created before payment starts;
- payment completion emits an event;
- seat reservation is completed by consuming the payment completion event;
- payment failure emits an event;
- payment failure triggers compensation by releasing the held seat;
- payment timeout or abandoned checkout must eventually release the hold;
- duplicate payment events must not duplicate reservations;
- failed event handling must be retryable.

## Public UI

The UI should support:

- login;
- viewing 3 seats;
- selecting a seat;
- proceeding through mock payment;
- seeing final reservation status.

## Required Reliability Behavior

- seat hold must be atomic;
- concurrency must be enforced at the database level or through explicit row locks;
- payment events must be idempotent;
- saga steps must be idempotent;
- compensation must release failed or expired holds;
- failures and conflicts should return clear user-facing states;
- all critical service boundaries should expose health endpoints.
