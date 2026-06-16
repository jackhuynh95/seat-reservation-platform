import React, { useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function App() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Password123!");
  const [accessToken, setAccessToken] = useState("");
  const [seats, setSeats] = useState([]);
  const [hold, setHold] = useState(null);
  const [payment, setPayment] = useState(null);
  const [message, setMessage] = useState("");
  const authHeaders = useMemo(() => (accessToken ? { authorization: `Bearer ${accessToken}` } : {}), [accessToken]);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      credentials: "include",
      headers: { "content-type": "application/json", ...authHeaders, ...(options.headers ?? {}) }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.message ?? text ?? `Request failed: ${response.status}`);
    return data;
  }, [authHeaders]);

  const login = async (event) => {
    event.preventDefault();
    setMessage("");
    const result = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setAccessToken(result.accessToken);
    setMessage("Logged in");
  };

  const loadSeats = async () => {
    setMessage("");
    setSeats(await request("/api/seats"));
  };

  const holdSeat = async (seatId) => {
    setMessage("");
    const result = await request(`/api/seats/${seatId}/hold`, { method: "POST", body: JSON.stringify({ holdMinutes: 5 }) });
    setHold(result);
    setMessage("Seat held");
    await loadSeats();
  };

  const createPayment = async () => {
    setMessage("");
    const result = await request("/api/payments/intents", { method: "POST", body: JSON.stringify({ seatId: hold.seatId, holdId: hold.holdId }) });
    setPayment(result);
    setMessage("Payment intent ready");
  };

  const completePayment = async () => {
    setMessage("");
    await request(`/api/payments/intents/${payment.paymentIntentId}/mock-complete`, { method: "POST" });
    setMessage("Payment completed. Reservation event queued.");
    setTimeout(loadSeats, 700);
  };

  return (
    <main>
      <section className="panel">
        <h1>Seat Reservation</h1>
        <form onSubmit={login} className="login">
          <input value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" aria-label="Password" />
          <button type="submit">Login</button>
        </form>
        <div className="actions">
          <button onClick={loadSeats} disabled={!accessToken}>Refresh Seats</button>
          <button onClick={createPayment} disabled={!hold || payment}>Create Payment</button>
          <button onClick={completePayment} disabled={!payment}>Mock Pay</button>
        </div>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="seats">
        {seats.map((seat) => (
          <article key={seat.id} className={`seat ${seat.status}`}>
            <strong>{seat.label}</strong>
            <span>{seat.status}</span>
            <button onClick={() => holdSeat(seat.id)} disabled={!accessToken || seat.status !== "available"}>Hold</button>
          </article>
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
