import { describe, expect, it } from "vitest";

const runLive = process.env.LIVE_E2E === "1";
const api = process.env.GATEWAY_URL ?? "http://localhost:3000";

async function request(path: string, init: RequestInit = {}, token?: string) {
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${response.status}: ${text}`);
  return { response, data };
}

describe.skipIf(!runLive)("live platform E2E", () => {
  it("login -> hold -> payment -> reserve", async () => {
    const login = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo@example.com", password: "Password123!" })
    });
    const token = login.data.accessToken;
    const seats = await request("/api/seats", {}, token);
    const available = seats.data.find((seat: { status: string }) => seat.status === "available");
    expect(available).toBeTruthy();
    const hold = await request(`/api/seats/${available.id}/hold`, { method: "POST", body: JSON.stringify({ holdMinutes: 5 }) }, token);
    const payment = await request("/api/payments/intents", { method: "POST", body: JSON.stringify({ seatId: available.id, holdId: hold.data.holdId }) }, token);
    await request(`/api/payments/intents/${payment.data.paymentIntentId}/mock-complete`, { method: "POST" }, token);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const after = await request("/api/seats", {}, token);
    expect(after.data.find((seat: { id: string }) => seat.id === available.id).status).toBe("reserved");
  });
});
