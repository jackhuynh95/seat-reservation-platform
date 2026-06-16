import "reflect-metadata";
import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, Injectable, Module, Param, Post, Req } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { PaymentEventV1, PaymentEventType } from "@seat-reservation/contracts";
import { correlationId, correlationMiddleware, createPgPool, log, numberEnv, publishPaymentEvent, readiness, requiredEnv, runMigrations } from "@seat-reservation/common";
import { signWebhookBody, verifyWebhookSignature } from "./security.js";

const service = "payment-service";
const pool = createPgPool(service);
const createIntentSchema = z.object({ seatId: z.string().uuid(), holdId: z.string().uuid() });
const webhookSchema = z.object({
  eventId: z.string().uuid(),
  type: z.enum(["payment.completed.v1", "payment.failed.v1"]),
  paymentIntentId: z.string().uuid()
});

function requireGatewayUser(userId: string | undefined): string {
  if (!userId) throw new ForbiddenException("Missing gateway user context");
  return userId;
}

@Injectable()
class PaymentService {
  async createIntent(userId: string, input: unknown, correlation: string) {
    const body = createIntentSchema.parse(input);
    const amountCents = numberEnv("SEAT_PRICE_CENTS", 5000);
    const result = await pool.query<{ id: string; amount_cents: number; currency: string }>(
      "insert into payment_intents(user_id, seat_id, hold_id, amount_cents) values ($1, $2, $3, $4) returning id, amount_cents, currency",
      [userId, body.seatId, body.holdId, amountCents]
    );
    await this.audit("payment_initiated", userId, correlation, { paymentIntentId: result.rows[0].id, seatId: body.seatId, holdId: body.holdId });
    return { paymentIntentId: result.rows[0].id, amountCents: result.rows[0].amount_cents, currency: result.rows[0].currency };
  }

  async mockComplete(userId: string, paymentIntentId: string, correlation: string, failed = false) {
    // TODO(prod/security): remove this mock provider shortcut when integrating a real payment provider.
    const intent = await pool.query<{ user_id: string }>("select user_id from payment_intents where id = $1", [paymentIntentId]);
    if (!intent.rowCount || intent.rows[0].user_id !== userId) throw new ForbiddenException("Payment intent not available");
    return this.processProviderEvent({ eventId: randomUUID(), type: failed ? "payment.failed.v1" : "payment.completed.v1", paymentIntentId }, correlation, new Date());
  }

  async processWebhook(rawBody: Buffer, timestamp: string | undefined, signature: string | undefined, correlation: string) {
    verifyWebhookSignature(requiredEnv("PAYMENT_WEBHOOK_SECRET"), timestamp, rawBody, signature);
    const parsed = webhookSchema.parse(JSON.parse(rawBody.toString("utf8")));
    return this.processProviderEvent(parsed, correlation, new Date(Number(timestamp) * 1000));
  }

  signedWebhookFor(paymentIntentId: string, type: PaymentEventType) {
    const body = JSON.stringify({ eventId: randomUUID(), type, paymentIntentId });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    return {
      body: JSON.parse(body),
      timestamp,
      signature: signWebhookBody(requiredEnv("PAYMENT_WEBHOOK_SECRET"), timestamp, body)
    };
  }

  private async processProviderEvent(input: { eventId: string; type: PaymentEventType; paymentIntentId: string }, correlation: string, signatureTimestamp: Date) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const intent = await client.query<{ id: string; user_id: string; seat_id: string; hold_id: string; amount_cents: number; status: string }>(
        "select id, user_id, seat_id, hold_id, amount_cents, status from payment_intents where id = $1 for update",
        [input.paymentIntentId]
      );
      if (!intent.rowCount) throw new ForbiddenException("Payment intent not found");
      const inserted = await client.query(
        "insert into payment_webhook_events(event_id, payment_intent_id, event_type, signature_timestamp) values ($1, $2, $3, $4) on conflict do nothing",
        [input.eventId, input.paymentIntentId, input.type, signatureTimestamp]
      );
      if (!inserted.rowCount) {
        await client.query("commit");
        return { accepted: true, duplicate: true };
      }
      const status = input.type === "payment.completed.v1" ? "completed" : "failed";
      await client.query("update payment_intents set status = $1, updated_at = now() where id = $2 and status = 'pending'", [status, input.paymentIntentId]);
      const row = intent.rows[0];
      const event: PaymentEventV1 = {
        eventId: input.eventId,
        eventType: input.type,
        occurredAt: new Date().toISOString(),
        correlationId: correlation,
        paymentIntentId: row.id,
        holdId: row.hold_id,
        seatId: row.seat_id,
        userId: row.user_id,
        amountCents: row.amount_cents
      };
      await client.query("commit");
      await publishPaymentEvent(event);
      return { accepted: true, duplicate: false, event };
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async audit(action: string, userId: string | null, correlation: string, metadata: Record<string, unknown>) {
    await pool.query("insert into audit_logs(service, action, user_id, correlation_id, metadata) values ($1, $2, $3, $4, $5)", [service, action, userId, correlation, metadata]);
  }
}

@Controller()
class PaymentController {
  private readonly payments = new PaymentService();

  @Get("/health/live")
  live() {
    return { ok: true };
  }

  @Get("/health/ready")
  ready() {
    return readiness(pool);
  }

  @Post("/payments/intents")
  @HttpCode(201)
  create(@Headers("x-user-id") userId: string | undefined, @Headers("x-correlation-id") cid: string | undefined, @Body() body: unknown) {
    return this.payments.createIntent(requireGatewayUser(userId), body, cid ?? randomUUID());
  }

  @Post("/payments/intents/:paymentIntentId/mock-complete")
  @HttpCode(202)
  complete(@Headers("x-user-id") userId: string | undefined, @Headers("x-correlation-id") cid: string | undefined, @Param("paymentIntentId") paymentIntentId: string) {
    return this.payments.mockComplete(requireGatewayUser(userId), paymentIntentId, cid ?? randomUUID());
  }

  @Post("/payments/intents/:paymentIntentId/mock-fail")
  @HttpCode(202)
  fail(@Headers("x-user-id") userId: string | undefined, @Headers("x-correlation-id") cid: string | undefined, @Param("paymentIntentId") paymentIntentId: string) {
    return this.payments.mockComplete(requireGatewayUser(userId), paymentIntentId, cid ?? randomUUID(), true);
  }

  @Post("/payments/intents/:paymentIntentId/signed-webhook")
  signed(@Param("paymentIntentId") paymentIntentId: string) {
    return this.payments.signedWebhookFor(paymentIntentId, "payment.completed.v1");
  }

  @Post("/webhooks/mock-payment")
  @HttpCode(202)
  webhook(@Req() req: { body: Buffer }, @Headers("x-payment-timestamp") timestamp: string | undefined, @Headers("x-payment-signature") signature: string | undefined) {
    return this.payments.processWebhook(req.body, timestamp, signature, correlationId(req as never));
  }
}

@Module({ controllers: [PaymentController], providers: [PaymentService] })
class PaymentModule {}

async function bootstrap() {
  await runMigrations(pool, join(process.cwd(), "src/migrations"));
  const app = await NestFactory.create(PaymentModule, { bodyParser: false, bufferLogs: false });
  app.use(helmet());
  app.use("/webhooks/mock-payment", express.raw({ type: "*/*" }));
  app.use(express.json());
  app.use(correlationMiddleware(service));
  app.enableShutdownHooks();
  await app.listen(numberEnv("PAYMENT_SERVICE_PORT", 3003));
  log("info", service, "started", { port: numberEnv("PAYMENT_SERVICE_PORT", 3003) });
}

bootstrap().catch((error) => {
  log("error", service, "startup_failed", { error: String(error) });
  process.exit(1);
});
