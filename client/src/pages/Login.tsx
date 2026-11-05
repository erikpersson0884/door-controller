import { useState, type FormEvent } from "react";
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
      const data: LoginResponse = await r.json();

      if (data.ok) {
        setAuthed(true); // PublicRoute redirects to "/"
      } else {
        setStatus("Wrong password");
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
    </div>
  );
}
