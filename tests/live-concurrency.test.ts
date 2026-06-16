import { describe, expect, it } from "vitest";

const runLive = process.env.LIVE_E2E === "1";
const api = process.env.GATEWAY_URL ?? "http://localhost:3000";

async function login(email = "demo@example.com") {
  const response = await fetch(`${api}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Password123!" })
  });
  return (await response.json()).accessToken as string;
}

async function json(path: string, token: string, init: RequestInit = {}) {
  return fetch(`${api}${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.headers ?? {}) }
  });
}

describe.skipIf(!runLive)("live concurrency and conflict behavior", () => {
  it("only one concurrent hold wins for one seat", async () => {
    const token = await login();
    const seats = await (await json("/api/seats", token)).json();
    const available = seats.find((seat: { status: string }) => seat.status === "available");
    expect(available).toBeTruthy();
    const attempts = await Promise.allSettled([
      json(`/api/seats/${available.id}/hold`, token, { method: "POST", body: JSON.stringify({ holdMinutes: 5 }) }),
      json(`/api/seats/${available.id}/hold`, token, { method: "POST", body: JSON.stringify({ holdMinutes: 5 }) })
    ]);
    const successes = attempts.filter((attempt) => attempt.status === "fulfilled" && attempt.value.ok);
    expect(successes).toHaveLength(1);
  });
});
