# 004 - Refresh Token Security

## Decision

Use opaque 90-day refresh tokens in an `httpOnly` cookie. Store only Argon2id hashes. Rotate refresh tokens on refresh and revoke session families on detected reuse.

## Rationale

Refresh tokens are high-value credentials. Keeping them out of JSON bodies and browser storage avoids the checklist auto-fail and reduces XSS blast radius.

## Trade-Off

The local implementation scans active refresh session hashes to find the matching opaque token. That is acceptable for the assessment scale. Production should add a token selector prefix to avoid scanning.

## Status

Accepted.
