import amqp, { Channel, ConsumeMessage } from "amqplib";
import { NextFunction, Request, Response } from "express";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PAYMENT_EVENTS_EXCHANGE, PAYMENT_EVENTS_QUEUE, PaymentEventV1 } from "@seat-reservation/contracts";

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export function numberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric environment variable: ${name}`);
  return parsed;
}

export function createPgPool(serviceName: string): Pool {
  return new Pool({
    host: requiredEnv("DB_HOST"),
    port: numberEnv("DB_PORT", 5432),
    user: requiredEnv("DB_USERNAME"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_DATABASE"),
    max: numberEnv("DB_POOL_MAX", 10),
    application_name: serviceName
  });
}

export async function runMigrations(pool: Pool, migrationsDir: string): Promise<void> {
  await pool.query("create table if not exists schema_migrations (service text not null, version text not null, applied_at timestamptz not null default now(), primary key(service, version))");
  const service = migrationsDir.split("/").at(-3) ?? "service";
  for (const file of readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort()) {
    const version = file;
    const exists = await pool.query("select 1 from schema_migrations where service = $1 and version = $2", [service, version]);
    if (exists.rowCount) continue;
    await pool.query("begin");
    try {
      await pool.query(readFileSync(join(migrationsDir, file), "utf8"));
      await pool.query("insert into schema_migrations(service, version) values ($1, $2)", [service, version]);
      await pool.query("commit");
      log("info", service, "migration_applied", { version });
    } catch (error) {
      await pool.query("rollback");
      throw error;
    }
  }
}

export function log(level: "info" | "warn" | "error", service: string, message: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level, service, message, at: new Date().toISOString(), ...fields }));
}

export function correlationMiddleware(service: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const correlationId = req.header("x-correlation-id") ?? randomUUID();
    req.headers["x-correlation-id"] = correlationId;
    res.setHeader("x-correlation-id", correlationId);
    log("info", service, "http_request", { correlationId, method: req.method, path: req.path });
    next();
  };
}

export function correlationId(req: Request): string {
  return req.header("x-correlation-id") ?? randomUUID();
}

export async function readiness(pool: Pool): Promise<{ ok: true }> {
  await pool.query("select 1");
  return { ok: true };
}

export async function connectRabbit(): Promise<{ connection: { close(): Promise<void> }; channel: Channel }> {
  const connection = await amqp.connect(requiredEnv("RABBITMQ_URL"));
  const channel = await connection.createChannel();
  await channel.assertExchange(PAYMENT_EVENTS_EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(PAYMENT_EVENTS_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": `${PAYMENT_EVENTS_EXCHANGE}.dlx`
    }
  });
  await channel.assertExchange(`${PAYMENT_EVENTS_EXCHANGE}.dlx`, "fanout", { durable: true });
  await channel.bindQueue(PAYMENT_EVENTS_QUEUE, PAYMENT_EVENTS_EXCHANGE, "payment.*.v1");
  return { connection, channel };
}

export async function publishPaymentEvent(event: PaymentEventV1): Promise<void> {
  const { connection, channel } = await connectRabbit();
  channel.publish(PAYMENT_EVENTS_EXCHANGE, event.eventType, Buffer.from(JSON.stringify(event)), {
    contentType: "application/json",
    persistent: true,
    correlationId: event.correlationId,
    messageId: event.eventId
  });
  await channel.close();
  await connection.close();
}

export async function consumePaymentEvents(handler: (event: PaymentEventV1) => Promise<void>): Promise<{ connection: { close(): Promise<void> }; channel: Channel }> {
  const rabbit = await connectRabbit();
  await rabbit.channel.prefetch(5);
  await rabbit.channel.consume(PAYMENT_EVENTS_QUEUE, async (message: ConsumeMessage | null) => {
    if (!message) return;
    try {
      const event = JSON.parse(message.content.toString()) as PaymentEventV1;
      await handler(event);
      rabbit.channel.ack(message);
    } catch (error) {
      const deaths = Number(message.properties.headers?.["x-death"]?.[0]?.count ?? 0);
      log("error", "payment-worker", "payment_event_failed", { error: String(error), deaths });
      rabbit.channel.nack(message, false, deaths < 5);
    }
  });
  return rabbit;
}
