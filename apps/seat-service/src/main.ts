import "reflect-metadata";
import { Body, ConflictException, Controller, ForbiddenException, Get, Headers, HttpCode, Injectable, Module, Param, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { join } from "node:path";
import { PoolClient } from "pg";
import { z } from "zod";
import { PaymentEventV1, SeatDto } from "@seat-reservation/contracts";
import { correlationMiddleware, createPgPool, log, numberEnv, readiness, requiredEnv, runMigrations } from "@seat-reservation/common";

const service = "seat-service";
const pool = createPgPool(service);
const holdBodySchema = z.object({ holdMinutes: z.number().int().min(1).max(15).optional() }).optional();

function requireGatewayUser(userId: string | undefined): string {
  if (!userId) throw new ForbiddenException("Missing gateway user context");
  return userId;
}

@Injectable()
class SeatService {
  async listSeats(): Promise<SeatDto[]> {
    await this.expireHolds(25);
    const result = await pool.query<{
      id: string;
      label: string;
      status: SeatDto["status"];
      held_by_user_id: string | null;
      hold_id: string | null;
      hold_expires_at: Date | null;
      reserved_by_user_id: string | null;
    }>(
      `select s.id, s.label, s.status,
        h.user_id as held_by_user_id, h.id as hold_id, h.expires_at as hold_expires_at,
        s.reserved_by_user_id
       from seats s
       left join seat_holds h on h.seat_id = s.id and h.status = 'held'
       order by s.label`
    );
    return result.rows.map((row) => ({
      id: row.id,
      label: row.label,
      status: row.status,
      heldByUserId: row.held_by_user_id ?? undefined,
      holdId: row.hold_id ?? undefined,
      holdExpiresAt: row.hold_expires_at?.toISOString(),
      reservedByUserId: row.reserved_by_user_id ?? undefined
    }));
  }

  async holdSeat(seatId: string, userId: string, body: unknown) {
    const parsed = holdBodySchema.parse(body);
    const minutes = parsed?.holdMinutes ?? 5;
    await this.expireHolds(25);
    const client = await pool.connect();
    try {
      await client.query("begin isolation level serializable");
      const seat = await client.query<{ id: string; status: string }>("select id, status from seats where id = $1 for update", [seatId]);
      if (!seat.rowCount) throw new ConflictException("Seat not found");
      if (seat.rows[0].status !== "available") throw new ConflictException("Seat is not available");
      const existing = await client.query("select id from seat_holds where user_id = $1 and status = 'held' for update", [userId]);
      if (existing.rowCount) throw new ConflictException("User already has an active hold");
      const hold = await client.query<{ id: string; expires_at: Date }>(
        "insert into seat_holds(seat_id, user_id, expires_at) values ($1, $2, now() + ($3 || ' minutes')::interval) returning id, expires_at",
        [seatId, userId, minutes]
      );
      await client.query("update seats set status = 'held' where id = $1", [seatId]);
      await client.query("commit");
      return { holdId: hold.rows[0].id, seatId, expiresAt: hold.rows[0].expires_at.toISOString() };
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      if (String(error).includes("duplicate key")) throw new ConflictException("Seat or user already has an active hold");
      throw error;
    } finally {
      client.release();
    }
  }

  async applyPaymentEvent(event: PaymentEventV1): Promise<{ applied: boolean; action: string }> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const inserted = await client.query(
        "insert into processed_payment_events(event_id, event_type, payment_intent_id) values ($1, $2, $3) on conflict do nothing",
        [event.eventId, event.eventType, event.paymentIntentId]
      );
      if (!inserted.rowCount) {
        await client.query("commit");
        return { applied: false, action: "duplicate_noop" };
      }
      const hold = await client.query<{ id: string; seat_id: string; user_id: string; status: string }>(
        "select id, seat_id, user_id, status from seat_holds where id = $1 for update",
        [event.holdId]
      );
      if (!hold.rowCount) {
        await client.query("commit");
        return { applied: true, action: "missing_hold_noop" };
      }
      if (event.eventType === "payment.completed.v1") {
        await this.reserveLockedHold(client, event, hold.rows[0]);
        await client.query("commit");
        return { applied: true, action: "reserved" };
      }
      await this.releaseLockedHold(client, event.holdId, event.seatId, "released");
      await client.query("commit");
      return { applied: true, action: "released" };
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async expireHolds(limit: number): Promise<number> {
    const result = await pool.query(
      `with expired as (
        select id, seat_id from seat_holds
        where status = 'held' and expires_at < now()
        order by expires_at
        limit $1
        for update skip locked
      ), updated_holds as (
        update seat_holds h set status = 'expired', updated_at = now()
        from expired e where h.id = e.id
        returning h.seat_id
      )
      update seats s set status = 'available'
      from updated_holds h
      where s.id = h.seat_id and s.status = 'held'`,
      [limit]
    );
    return result.rowCount ?? 0;
  }

  private async reserveLockedHold(client: PoolClient, event: PaymentEventV1, hold: { id: string; seat_id: string; user_id: string; status: string }) {
    if (hold.status === "reserved") return;
    if (hold.status !== "held") return;
    await client.query(
      "insert into seat_reservations(seat_id, hold_id, user_id, payment_intent_id) values ($1, $2, $3, $4) on conflict do nothing",
      [event.seatId, event.holdId, event.userId, event.paymentIntentId]
    );
    await client.query("update seat_holds set status = 'reserved', payment_intent_id = $1, updated_at = now() where id = $2", [event.paymentIntentId, event.holdId]);
    await client.query("update seats set status = 'reserved', reserved_by_user_id = $1, reserved_at = now() where id = $2", [event.userId, event.seatId]);
  }

  private async releaseLockedHold(client: PoolClient, holdId: string, seatId: string, status: "released" | "expired") {
    await client.query("update seat_holds set status = $1, updated_at = now() where id = $2 and status = 'held'", [status, holdId]);
    await client.query("update seats set status = 'available' where id = $1 and status = 'held'", [seatId]);
  }
}

@Controller()
class SeatController {
  private readonly seats = new SeatService();

  @Get("/health/live")
  live() {
    return { ok: true };
  }

  @Get("/health/ready")
  ready() {
    return readiness(pool);
  }

  @Get("/seats")
  list() {
    return this.seats.listSeats();
  }

  @Post("/seats/:seatId/hold")
  @HttpCode(201)
  hold(@Param("seatId") seatId: string, @Headers("x-user-id") userId: string | undefined, @Body() body: unknown) {
    return this.seats.holdSeat(seatId, requireGatewayUser(userId), body);
  }

  @Post("/internal/payment-events")
  @HttpCode(202)
  paymentEvent(@Headers("x-internal-token") token: string | undefined, @Body() event: PaymentEventV1) {
    if (token !== requiredEnv("INTERNAL_SERVICE_TOKEN")) throw new ForbiddenException("Invalid internal token");
    return this.seats.applyPaymentEvent(event);
  }
}

@Module({ controllers: [SeatController], providers: [SeatService] })
class SeatModule {}

async function bootstrap() {
  await runMigrations(pool, join(process.cwd(), "src/migrations"));
  const app = await NestFactory.create(SeatModule, { bufferLogs: false });
  app.use(helmet());
  app.use(correlationMiddleware(service));
  app.enableShutdownHooks();
  await app.listen(numberEnv("SEAT_SERVICE_PORT", 3002));
  setInterval(() => {
    void app.get(SeatService).expireHolds(25).catch((error) => log("error", service, "hold_expiry_failed", { error: String(error) }));
  }, 30000).unref();
  log("info", service, "started", { port: numberEnv("SEAT_SERVICE_PORT", 3002) });
}

bootstrap().catch((error) => {
  log("error", service, "startup_failed", { error: String(error) });
  process.exit(1);
});
