import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhookBody(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verifyWebhookSignature(secret: string, timestamp: string | undefined, rawBody: Buffer, signature: string | undefined, maxAgeSeconds = 300): void {
  if (!timestamp || !signature) throw new Error("Missing webhook signature");
  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) throw new Error("Invalid webhook timestamp");
  const ageSeconds = Math.abs(Date.now() / 1000 - issuedAt);
  if (ageSeconds > maxAgeSeconds) throw new Error("Stale webhook timestamp");
  const expected = signWebhookBody(secret, timestamp, rawBody.toString("utf8"));
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new Error("Invalid webhook signature");
  }
}
