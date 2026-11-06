import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const { setAuthed } = useAuth();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");

    try {
      const r = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const responseText = await r.text();
      let data: LoginResponse;
      try {
        data = JSON.parse(responseText) as LoginResponse;
      } catch {
        throw new Error(
          r.ok
            ? "The server returned an invalid response"
            : `Login service unavailable (${r.status})`
        );
      }

      if (r.ok && data.ok) {
        setAuthed(true); // PublicRoute redirects to "/"
      } else {
        setStatus(data.error ?? "Wrong password");
      }
    } catch (err) {
      setStatus("Something went wrong: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <main className="login-page">
      <div className="login-status" role="status">
        <span className="status-dot" aria-hidden="true" />
        <span>System online</span>
      </div>

      <section className="login-content" aria-labelledby="login-title">
        <h1 id="login-title">Access</h1>
        <p className="login-location">Door Controller</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="door-password">Password</label>
          <input
            id="door-password"
            type="password"
            className="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" className="btn-open">Log in</button>
        </form>
        <div id="status" className="status-error" role="alert">{status}</div>
      </section>

      <footer className="login-footer">
        <Link className="text-link" to="/admin/login">Administrator login</Link>
      </footer>
    </main>
  );
}
