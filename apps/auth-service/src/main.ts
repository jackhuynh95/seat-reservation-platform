import "reflect-metadata";
import { Body, Controller, Get, Headers, HttpCode, Injectable, Module, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import argon2 from "argon2";
import cookie from "cookie";
import helmet from "helmet";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, randomUUID } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { correlationMiddleware, createPgPool, log, numberEnv, optionalEnv, readiness, requiredEnv, runMigrations } from "@seat-reservation/common";

const service = "auth-service";
const pool = createPgPool(service);
const refreshCookieName = "sr_refresh";
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

@Injectable()
class AuthService {
  private readonly accessSecret = new TextEncoder().encode(requiredEnv("JWT_ACCESS_SECRET"));

  async seedDemoUser(): Promise<void> {
    const email = optionalEnv("DEMO_USER_EMAIL", "demo@example.com");
    const password = optionalEnv("DEMO_USER_PASSWORD", "Password123!");
    const exists = await pool.query("select 1 from auth_users where email = $1", [email]);
    if (exists.rowCount) return;
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await pool.query("insert into auth_users(email, password_hash) values ($1, $2)", [email, passwordHash]);
    log("info", service, "demo_user_seeded", { email });
  }

  async login(input: unknown, correlation: string) {
    const { email, password } = loginSchema.parse(input);
    const user = await pool.query<{ id: string; email: string; password_hash: string }>("select id, email, password_hash from auth_users where email = $1", [email]);
    const row = user.rows[0];
    // TODO(security): replace ad-hoc timing equalization with a calibrated constant dummy hash.
    const valid = row ? await argon2.verify(row.password_hash, password) : await argon2.verify(await argon2.hash(randomUUID(), { type: argon2.argon2id }), password).catch(() => false);
    if (!row || !valid) {
      await this.audit("login_failed", null, correlation, { email });
      throw new UnauthorizedException("Invalid credentials");
    }
    const session = await this.createRefreshSession(row.id);
    await this.audit("login", row.id, correlation, {});
    return { accessToken: await this.signAccessToken(row.id, row.email, correlation), opaqueToken: session.opaqueToken };
  }

  async refresh(cookieToken: string | undefined, correlation: string) {
    if (!cookieToken) throw new UnauthorizedException("Missing refresh token");
    const active = await pool.query<{ id: string; user_id: string; family_id: string; token_hash: string; email: string }>(
      `select s.id, s.user_id, s.family_id, s.token_hash, u.email
       from auth_refresh_sessions s join auth_users u on u.id = s.user_id
       where s.expires_at > now()`
    );
    for (const row of active.rows) {
      const matches = await argon2.verify(row.token_hash, cookieToken).catch(() => false);
      if (!matches) continue;
      const client = await pool.connect();
      try {
        await client.query("begin");
        const locked = await client.query("select revoked_at from auth_refresh_sessions where id = $1 for update", [row.id]);
        if (locked.rows[0]?.revoked_at) {
          await client.query("update auth_refresh_sessions set revoked_at = coalesce(revoked_at, now()) where family_id = $1", [row.family_id]);
          await client.query("commit");
          throw new UnauthorizedException("Refresh token reuse detected");
        }
        const nextToken = this.newOpaqueToken();
        const nextHash = await argon2.hash(nextToken, { type: argon2.argon2id });
        const inserted = await client.query<{ id: string }>(
          "insert into auth_refresh_sessions(user_id, family_id, token_hash, expires_at) values ($1, $2, $3, now() + interval '90 days') returning id",
          [row.user_id, row.family_id, nextHash]
        );
        await client.query("update auth_refresh_sessions set revoked_at = now(), replaced_by_session_id = $1 where id = $2", [inserted.rows[0].id, row.id]);
        await client.query("commit");
        await this.audit("refresh_rotate", row.user_id, correlation, {});
        return { accessToken: await this.signAccessToken(row.user_id, row.email, correlation), opaqueToken: nextToken };
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    }
    throw new UnauthorizedException("Invalid refresh token");
  }

  async logout(cookieToken: string | undefined, correlation: string): Promise<void> {
    if (!cookieToken) return;
    const sessions = await pool.query<{ id: string; token_hash: string; user_id: string }>("select id, token_hash, user_id from auth_refresh_sessions where revoked_at is null");
    for (const row of sessions.rows) {
      if (await argon2.verify(row.token_hash, cookieToken).catch(() => false)) {
        await pool.query("update auth_refresh_sessions set revoked_at = now() where id = $1", [row.id]);
        await this.audit("logout", row.user_id, correlation, {});
        return;
      }
    }
  }

  async logoutAll(userId: string, correlation: string): Promise<void> {
    await pool.query("update auth_refresh_sessions set revoked_at = now() where user_id = $1 and revoked_at is null", [userId]);
    await this.audit("session_revoke_all", userId, correlation, {});
  }

  async verifyAccessToken(authHeader: string | undefined) {
    if (!authHeader?.startsWith("Bearer ")) throw new UnauthorizedException("Missing bearer token");
    const token = authHeader.slice("Bearer ".length);
    const verified = await jwtVerify(token, this.accessSecret);
    return verified.payload;
  }

  cookieHeader(opaqueToken: string, clear = false): string {
    return cookie.serialize(refreshCookieName, clear ? "" : opaqueToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: optionalEnv("COOKIE_SECURE", "false") === "true",
      path: "/api/auth",
      maxAge: clear ? 0 : 60 * 60 * 24 * 90
    });
  }

  private async createRefreshSession(userId: string): Promise<{ opaqueToken: string }> {
    const opaqueToken = this.newOpaqueToken();
    const tokenHash = await argon2.hash(opaqueToken, { type: argon2.argon2id });
    await pool.query(
      "insert into auth_refresh_sessions(user_id, family_id, token_hash, expires_at) values ($1, $2, $3, now() + interval '90 days')",
      [userId, randomUUID(), tokenHash]
    );
    return { opaqueToken };
  }

  private newOpaqueToken(): string {
    return randomBytes(48).toString("base64url");
  }

  private async signAccessToken(userId: string, email: string, correlation: string): Promise<string> {
    return new SignJWT({ email, correlationId: correlation })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(this.accessSecret);
  }

  private async audit(action: string, userId: string | null, correlation: string, metadata: Record<string, unknown>) {
    await pool.query("insert into audit_logs(service, action, user_id, correlation_id, metadata) values ($1, $2, $3, $4, $5)", [service, action, userId, correlation, metadata]);
  }
}

@Controller()
class AuthController {
  private readonly auth = new AuthService();

  @Get("/health/live")
  live() {
    return { ok: true };
  }

  @Get("/health/ready")
  ready() {
    return readiness(pool);
  }

  @Post("/auth/login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Headers("x-correlation-id") cid: string | undefined, @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void }) {
    const result = await this.auth.login(body, cid ?? randomUUID());
    res.setHeader("set-cookie", this.auth.cookieHeader(result.opaqueToken));
    return { accessToken: result.accessToken };
  }

  @Post("/auth/refresh")
  @HttpCode(200)
  async refresh(@Req() req: { headers: Record<string, string | undefined> }, @Headers("x-correlation-id") cid: string | undefined, @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void }) {
    const cookies = cookie.parse(req.headers.cookie ?? "");
    const result = await this.auth.refresh(cookies[refreshCookieName], cid ?? randomUUID());
    res.setHeader("set-cookie", this.auth.cookieHeader(result.opaqueToken));
    return { accessToken: result.accessToken };
  }

  @Post("/auth/logout")
  @HttpCode(204)
  async logout(@Req() req: { headers: Record<string, string | undefined> }, @Headers("x-correlation-id") cid: string | undefined, @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void }) {
    const cookies = cookie.parse(req.headers.cookie ?? "");
    await this.auth.logout(cookies[refreshCookieName], cid ?? randomUUID());
    res.setHeader("set-cookie", this.auth.cookieHeader("", true));
  }

  @Post("/auth/logout-all")
  @HttpCode(204)
  async logoutAll(@Headers("authorization") authorization: string | undefined, @Headers("x-correlation-id") cid: string | undefined, @Res({ passthrough: true }) res: { setHeader(name: string, value: string): void }) {
    const payload = await this.auth.verifyAccessToken(authorization);
    await this.auth.logoutAll(String(payload.sub), cid ?? randomUUID());
    res.setHeader("set-cookie", this.auth.cookieHeader("", true));
  }

  @Get("/internal/auth/verify")
  async verify(@Headers("authorization") authorization: string | undefined) {
    const payload = await this.auth.verifyAccessToken(authorization);
    return { userId: payload.sub, email: payload.email };
  }
}

@Module({ controllers: [AuthController], providers: [AuthService] })
class AuthModule {}

async function bootstrap() {
  const migrationsDir = join(process.cwd(), "src/migrations");
  await runMigrations(pool, migrationsDir);
  const app = await NestFactory.create(AuthModule, { bufferLogs: false });
  app.use(helmet());
  app.use(correlationMiddleware(service));
  app.enableShutdownHooks();
  const auth = app.get(AuthService);
  await auth.seedDemoUser();
  await app.listen(numberEnv("AUTH_SERVICE_PORT", 3001));
  log("info", service, "started", { port: numberEnv("AUTH_SERVICE_PORT", 3001) });
}

bootstrap().catch((error) => {
  log("error", service, "startup_failed", { error: String(error) });
  process.exit(1);
});
