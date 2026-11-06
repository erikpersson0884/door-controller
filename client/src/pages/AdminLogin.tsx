import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const { setAdminAuthed } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setStatus(data.error ?? "Wrong username or password");
        return;
      }
      setAdminAuthed(true);
      window.location.assign("/admin");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Admin login failed");
    }
  }

  return (
    <main className="login-page admin-login-page">
      <div className="login-status" role="status">
        <span className="status-dot" aria-hidden="true" />
        <span>System online</span>
      </div>

      <section className="login-content" aria-labelledby="admin-login-title">
        <h1 id="admin-login-title">Admin access</h1>
        <p className="login-location">Door controller</p>

        <form className="login-form admin-login-form" onSubmit={handleSubmit}>
        <label htmlFor="admin-username">Username</label>
        <input
          id="admin-username"
          className="password-input"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoFocus
          required
        />
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          className="password-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button type="submit" className="btn-open">Log in</button>
        </form>
        <div className="status-error" role="alert">{status}</div>
      </section>

      <footer className="login-footer">
        <Link className="text-link" to="/login">Door user login</Link>
      </footer>
    </main>
  );
}
