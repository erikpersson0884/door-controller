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
        <button type="submit" className="btn-open">Log In</button>
      </form>
      <div id="status" className="status-error">{status}</div>
      <p><Link className="text-link" to="/admin/login">Administrator login</Link></p>
    </div>
  );
}
