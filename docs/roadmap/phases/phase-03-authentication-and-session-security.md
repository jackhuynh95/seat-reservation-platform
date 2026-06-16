# Phase 3 - Authentication And Session Security

## Goal

Implement secure login and 90-day refresh sessions.

## Tasks

| ID | Task | Output | Status |
| --- | --- | --- | --- |
| 3.1.1 | Add user and refresh session schema | Migration | Planned |
| 3.2.1 | Implement Argon2id password verification | Auth service | Planned |
| 3.3.1 | Issue access token and httpOnly refresh cookie | Auth API | Planned |
| 3.4.1 | Hash refresh token in DB | Auth service | Planned |
| 3.4.2 | Rotate refresh token on refresh | Auth service | Planned |
| 3.4.3 | Detect refresh token reuse | Auth service | Planned |
| 3.5.1 | Logout current session | Auth API | Planned |
| 3.5.2 | Logout all sessions | Auth API | Planned |
| 3.6.1 | Add auth security tests | Tests | Planned |
| 3.7.1 | Add Redis-backed login rate limit | Gateway/auth | Planned |
| 3.7.2 | Add sensitive action audit logs | Auth service | Planned |
| 3.7.3 | Add timing equalization for login | Auth service or documented shortcut | Planned |

## Exit Criteria

- Login works.
- Refresh session expires at 90 days.
- Refresh token is not exposed to JavaScript.
- Security auto-fail items are avoided.
- Login is rate-limited.
- Sensitive auth actions are auditable.
