import { describe, expect, it } from "vitest";
import { signWebhookBody, verifyWebhookSignature } from "../apps/payment-service/src/security";

describe("webhook HMAC verification", () => {
  it("accepts a fresh matching signature", () => {
    const body = Buffer.from(JSON.stringify({ eventId: crypto.randomUUID(), type: "payment.completed.v1", paymentIntentId: crypto.randomUUID() }));
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signWebhookBody("test-secret", timestamp, body.toString("utf8"));
    expect(() => verifyWebhookSignature("test-secret", timestamp, body, signature)).not.toThrow();
  });

  it("rejects stale or mismatched signatures", () => {
    const body = Buffer.from("{}");
    const stale = Math.floor(Date.now() / 1000 - 600).toString();
    const signature = signWebhookBody("test-secret", stale, body.toString("utf8"));
    expect(() => verifyWebhookSignature("test-secret", stale, body, signature)).toThrow("Stale webhook timestamp");
    expect(() => verifyWebhookSignature("test-secret", Math.floor(Date.now() / 1000).toString(), body, "00")).toThrow("Invalid webhook signature");
  });
});
