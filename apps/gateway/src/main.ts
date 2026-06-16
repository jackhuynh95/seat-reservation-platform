import "reflect-metadata";
import { Body, Controller, Get, Headers, HttpCode, HttpException, HttpStatus, Injectable, Module, Param, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { AuthUser } from "@seat-reservation/contracts";
import { correlationMiddleware, log, numberEnv, requiredEnv } from "@seat-reservation/common";

const service = "gateway";
// TODO(scale): replace per-process limiter with Redis-backed distributed rate limit before horizontal scaling.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function userFromAuthHeader(authorization: string | undefined): Promise<AuthUser> {
  if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException("Missing bearer token");
  return jwtVerify(authorization.slice("Bearer ".length), new TextEncoder().encode(requiredEnv("JWT_ACCESS_SECRET"))).then((verified) => ({
    userId: String(verified.payload.sub),
    email: String(verified.payload.email)
  }));
}

function rateLimit(ip: string): void {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60000 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > numberEnv("RATE_LIMIT_PER_MINUTE", 120)) {
    throw new HttpException("Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
class GatewayProxy {
  async forward(baseUrl: string, path: string, init: RequestInit, res: { setHeader(name: string, value: string | string[]): void; status(code: number): unknown }) {
    const response = await fetch(`${baseUrl}${path}`, init);
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) res.setHeader("set-cookie", setCookie);
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      (res.status(response.status) as { send(body: string): void }).send(text);
      return;
    }
    if (contentType.includes("application/json")) return JSON.parse(text);
    return text ? { data: text } : undefined;
  }

  headers(reqHeaders: Record<string, string | undefined>, user?: AuthUser): HeadersInit {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-correlation-id": reqHeaders["x-correlation-id"] ?? randomUUID()
    };
    if (reqHeaders.cookie) headers.cookie = reqHeaders.cookie;
    if (reqHeaders.authorization) headers.authorization = reqHeaders.authorization;
    if (user) {
      headers["x-user-id"] = user.userId;
      headers["x-user-email"] = user.email;
    }
    return headers;
  }
}

@Controller()
class GatewayController {
  private readonly proxy = new GatewayProxy();

  @Get("/health/live")
  live() {
    return { ok: true };
  }

  @Get("/health/ready")
  async ready() {
    const checks = await Promise.all([
      fetch(`${requiredEnv("AUTH_SERVICE_URL")}/health/ready`),
      fetch(`${requiredEnv("SEAT_SERVICE_URL")}/health/ready`),
      fetch(`${requiredEnv("PAYMENT_SERVICE_URL")}/health/ready`)
    ]);
    return { ok: checks.every((check) => check.ok) };
  }

  @Post("/api/auth/login")
  @HttpCode(200)
  login(@Req() req: { headers: Record<string, string | undefined> }, @Body() body: unknown, @Res({ passthrough: true }) res: never) {
    return this.proxy.forward(requiredEnv("AUTH_SERVICE_URL"), "/auth/login", { method: "POST", headers: this.proxy.headers(req.headers), body: JSON.stringify(body) }, res);
  }

  @Post("/api/auth/refresh")
  @HttpCode(200)
  refresh(@Req() req: { headers: Record<string, string | undefined> }, @Res({ passthrough: true }) res: never) {
    return this.proxy.forward(requiredEnv("AUTH_SERVICE_URL"), "/auth/refresh", { method: "POST", headers: this.proxy.headers(req.headers) }, res);
  }

  @Post("/api/auth/logout")
  @HttpCode(204)
  logout(@Req() req: { headers: Record<string, string | undefined> }, @Res({ passthrough: true }) res: never) {
    return this.proxy.forward(requiredEnv("AUTH_SERVICE_URL"), "/auth/logout", { method: "POST", headers: this.proxy.headers(req.headers) }, res);
  }

  @Post("/api/auth/logout-all")
  @HttpCode(204)
  logoutAll(@Req() req: { headers: Record<string, string | undefined> }, @Res({ passthrough: true }) res: never) {
    return this.proxy.forward(requiredEnv("AUTH_SERVICE_URL"), "/auth/logout-all", { method: "POST", headers: this.proxy.headers(req.headers) }, res);
  }

  @Get("/api/seats")
  async seats(@Headers("authorization") authorization: string | undefined, @Req() req: { headers: Record<string, string | undefined> }, @Res({ passthrough: true }) res: never) {
    const user = await userFromAuthHeader(authorization);
    return this.proxy.forward(requiredEnv("SEAT_SERVICE_URL"), "/seats", { method: "GET", headers: this.proxy.headers(req.headers, user) }, res);
  }

  @Post("/api/seats/:seatId/hold")
  async hold(@Param("seatId") seatId: string, @Headers("authorization") authorization: string | undefined, @Req() req: { headers: Record<string, string | undefined> }, @Body() body: unknown, @Res({ passthrough: true }) res: never) {
    const user = await userFromAuthHeader(authorization);
    return this.proxy.forward(requiredEnv("SEAT_SERVICE_URL"), `/seats/${seatId}/hold`, { method: "POST", headers: this.proxy.headers(req.headers, user), body: JSON.stringify(body ?? {}) }, res);
  }

  @Post("/api/payments/intents")
  async createIntent(@Headers("authorization") authorization: string | undefined, @Req() req: { headers: Record<string, string | undefined> }, @Body() body: unknown, @Res({ passthrough: true }) res: never) {
    const user = await userFromAuthHeader(authorization);
    return this.proxy.forward(requiredEnv("PAYMENT_SERVICE_URL"), "/payments/intents", { method: "POST", headers: this.proxy.headers(req.headers, user), body: JSON.stringify(body) }, res);
  }

  @Post("/api/payments/intents/:paymentIntentId/mock-complete")
  async complete(@Param("paymentIntentId") paymentIntentId: string, @Headers("authorization") authorization: string | undefined, @Req() req: { headers: Record<string, string | undefined> }, @Res({ passthrough: true }) res: never) {
    const user = await userFromAuthHeader(authorization);
    return this.proxy.forward(requiredEnv("PAYMENT_SERVICE_URL"), `/payments/intents/${paymentIntentId}/mock-complete`, { method: "POST", headers: this.proxy.headers(req.headers, user) }, res);
  }

  @Post("/api/payments/intents/:paymentIntentId/mock-fail")
  async fail(@Param("paymentIntentId") paymentIntentId: string, @Headers("authorization") authorization: string | undefined, @Req() req: { headers: Record<string, string | undefined> }, @Res({ passthrough: true }) res: never) {
    const user = await userFromAuthHeader(authorization);
    return this.proxy.forward(requiredEnv("PAYMENT_SERVICE_URL"), `/payments/intents/${paymentIntentId}/mock-fail`, { method: "POST", headers: this.proxy.headers(req.headers, user) }, res);
  }
}

@Module({ controllers: [GatewayController], providers: [GatewayProxy] })
class GatewayModule {}

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, { bufferLogs: false });
  app.use(helmet());
  app.use(correlationMiddleware(service));
  app.use((req: Request, _res: Response, next: NextFunction) => {
    try {
      rateLimit(req.ip ?? "unknown");
      next();
    } catch (error) {
      next(error);
    }
  });
  const origins = requiredEnv("CORS_ORIGINS").split(",").map((origin) => origin.trim());
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      callback(new Error("CORS origin denied"), false);
    },
    credentials: true
  });
  app.enableShutdownHooks();
  await app.listen(numberEnv("GATEWAY_PORT", 3000));
  log("info", service, "started", { port: numberEnv("GATEWAY_PORT", 3000), corsOrigins: origins });
}

bootstrap().catch((error) => {
  log("error", service, "startup_failed", { error: String(error) });
  process.exit(1);
});
