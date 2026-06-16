# Quick Scan

Use this as a 5-minute pre-submit audit to catch auto-fail risks and judgment signals.

Read `docs/decisions/` first. If decision records are missing or empty, stop and fix that before submission.

## 0. Microservices Layout

```bash
rg --files apps 2>/dev/null || echo "NO apps/ FOLDER - likely monolith"
ls apps
```

Expect:

- at least `auth-service`, `seat-service`, and `payment-service`;
- ideally also `gateway`, `payment-worker`, and `web`.

Fail signal:

- only one backend folder;
- no `apps/` folder;
- services are folders but share one runtime process.

## 1. Message Broker

```bash
rg -n "kafka|rabbitmq|amqp|bull|BullMQ|ClientProxy|EventPattern" -g "*.ts" -g "*.json" -g "*.yml" -g "*.yaml"
```

Expect:

- RabbitMQ or Kafka exists in Docker Compose;
- services publish/consume business events.

Fail signal:

- only HTTP sync calls between services;
- no broker dependency.

## 2. Refresh Token Exposure

```bash
rg -n "refreshToken" -g "*.ts" | rg -v "httpOnly|cookie|hash|verify|rotate|revoke"
```

Expect:

- no refresh token returned in JSON body;
- refresh token is stored in an httpOnly cookie.

Critical fail signal:

- refresh token in JSON response;
- refresh token stored in localStorage.

## 3. Password Hashing

```bash
rg -n "bcrypt|sha256|md5|SHA" -g "*.ts" | rg -i "password|hash"
rg -n "argon2|argon2id" -g "*.ts"
```

Expect:

- Argon2id for passwords.

Critical fail signal:

- SHA/MD5/bcrypt for password hashing.

## 4. Secret Fallbacks

```bash
rg -n "JWT_SECRET|JWT_REFRESH_SECRET|SESSION_SECRET|WEBHOOK_SECRET" -g "*.ts" -g "*.js" -g ".env*" | rg "default|fallback|\\|\\||\\?\\?"
```

Expect:

- startup fails if required secrets are missing.

Critical fail signal:

- hardcoded default secret.

## 5. Concurrency Invariants

```bash
rg -n "FOR UPDATE|SERIALIZABLE|unique.*where|WHERE status|SKIP LOCKED" -g "*.ts" -g "*.sql" -i
rg -n "lock|serial|optimistic|pessimistic|concurrent|isolation" docs/decisions docs/architecture -i
```

Expect:

- atomic hold strategy;
- DB-level invariant or explicit lock;
- decision record explaining the locking trade-off.

Fail signal:

- only application-level `if seat is available then update`;
- no concurrency decision record.

## 6. Webhook HMAC

```bash
rg -n "timingSafeEqual|constructEvent|createHmac|webhook.*signature" -g "*.ts"
```

Expect:

- webhook signature verification;
- timestamp freshness check.

Critical fail signal:

- webhook endpoint accepts unsigned requests.

## 7. httpOnly Cookie

```bash
rg -n "httpOnly|sameSite|secure" -g "*.ts"
```

Expect:

- refresh cookie uses `httpOnly`;
- `sameSite` and `secure` are configured.

## 8. Health And Shutdown

```bash
rg -n "health|live|ready" -g "*.ts" | rg -i "route|get|handler|controller"
rg -n "SIGTERM|enableShutdownHooks|OnApplicationShutdown|beforeApplicationShutdown" -g "*.ts"
```

Expect:

- `/health/live` and `/health/ready` per service;
- graceful shutdown hooks.

## 9. Payment Compensation

```bash
rg -n "payment_failed|paymentFailed|payment.failed|payment_intent.payment_failed|release.*hold|hold.*release" -g "*.ts"
rg -n "Saga|compensation|outbox|inbox|dead-letter|DLQ" docs -i
```

Expect:

- payment failure releases hold;
- timeout or abandoned checkout releases hold;
- Saga/compensation is documented.

Fail signal:

- payment failure leaves seat held forever.

## 10. Production Awareness

```bash
rg -n "TODO\\(prod\\)|TODO\\(scale\\)|TODO\\(security\\)|TODO\\(ops\\)" -g "*.ts" -g "*.md"
```

Expect:

- production shortcuts are explicitly marked;
- decision records explain trade-offs.

Red flag:

- no production follow-up notes despite scoped implementation.

## Final Quick Scan Result

Record final scan notes here before submission:

| Area | Result | Notes |
| --- | --- | --- |
| Microservices layout | TODO | TODO |
| Broker | TODO | TODO |
| Refresh token safety | TODO | TODO |
| Password hashing | TODO | TODO |
| Secret fallback | TODO | TODO |
| Concurrency invariant | TODO | TODO |
| Webhook HMAC | TODO | TODO |
| Health/shutdown | TODO | TODO |
| Compensation | TODO | TODO |
| Production awareness | TODO | TODO |
