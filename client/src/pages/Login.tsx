import { useState } from "react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault(); // stops the native page reload
    setStatus("");

    try {
      const r = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();

      if (data.ok) {
        // Full reload so the server sees the new session cookie
        window.location.href = "/";
      } else {
        setStatus("Wrong password");
      }
    } catch (err: any) {
      setStatus("Something went wrong: " + err.message);
    }
  }

  return (
    <div className="container">
      <h1>🔒 Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          className="password-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        <br />
        <button type="submit" className="btn-open">
          Log In
        </button>
      </form>
      <div id="status" className="status-error">{status}</div>
    </div>
  );
}
