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
    <div className="container">
      <h1>Admin login</h1>
      <form onSubmit={handleSubmit}>
        <input
          className="password-input"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoFocus
          required
        />
        <input
          className="password-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <br />
        <button type="submit" className="btn-open">Log in</button>
      </form>
      <div className="status-error">{status}</div>
      <p><Link className="text-link" to="/login">Door user login</Link></p>
    </div>
  );
}
