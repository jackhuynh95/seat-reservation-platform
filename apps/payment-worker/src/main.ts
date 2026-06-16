import "reflect-metadata";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { PaymentEventV1 } from "@seat-reservation/contracts";
import { consumePaymentEvents, correlationMiddleware, log, numberEnv, requiredEnv } from "@seat-reservation/common";

const service = "payment-worker";
let ready = false;

async function applyToSeatService(event: PaymentEventV1): Promise<void> {
  const response = await fetch(`${requiredEnv("SEAT_SERVICE_URL")}/internal/payment-events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-token": requiredEnv("INTERNAL_SERVICE_TOKEN"),
      "x-correlation-id": event.correlationId
    },
    body: JSON.stringify(event)
  });
  if (!response.ok) {
    throw new Error(`seat-service rejected event ${event.eventId}: ${response.status} ${await response.text()}`);
  }
}

@Controller()
class WorkerHealthController {
  @Get("/health/live")
  live() {
    return { ok: true };
  }

  @Get("/health/ready")
  readyState() {
    return { ok: ready };
  }
}

@Module({ controllers: [WorkerHealthController] })
class WorkerModule {}

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule, { bufferLogs: false });
  app.use(helmet());
  app.use(correlationMiddleware(service));
  app.enableShutdownHooks();
  await app.listen(numberEnv("PAYMENT_WORKER_PORT", 3004));
  await consumePaymentEvents(async (event) => {
    log("info", service, "payment_event_received", { eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId });
    await applyToSeatService(event);
  });
  ready = true;
  log("info", service, "started", { port: numberEnv("PAYMENT_WORKER_PORT", 3004) });
}

bootstrap().catch((error) => {
  log("error", service, "startup_failed", { error: String(error) });
  process.exit(1);
});
