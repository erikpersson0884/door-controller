import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

type UnlockPassword = {
  id: number;
  label: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
};

type PasswordForm = {
  label: string;
  password: string;
  expiresOn: string;
};

const EMPTY_FORM: PasswordForm = { label: "", password: "", expiresOn: "" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

function endOfDayIso(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("Expiration must be a valid date");
  }
  return date.toISOString();
}

function dateForInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Admin() {
  const [passwords, setPasswords] = useState<UnlockPassword[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createdPassword, setCreatedPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPasswords() {
    const response = await fetch("/admin/unlock-passwords");
    if (!response.ok) throw new Error("Unable to load unlock passwords");
    const data = (await response.json()) as { passwords: UnlockPassword[] };
    setPasswords(data.passwords);
  }

  // The initial request synchronizes this screen with the server-backed list.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPasswords()
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Unable to load passwords");
      })
      .finally(() => setLoading(false));
  }, []);

  async function createPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setCreatedPassword("");

    let expiresAt: string | null;
    try {
      expiresAt = endOfDayIso(form.expiresOn);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid expiration");
      return;
    }

    const response = await fetch("/admin/unlock-passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label,
        password: form.password,
        expiresAt,
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      error?: string;
      password?: string;
    };
    if (!response.ok || !data.ok) {
      setStatus(data.error ?? "Unable to create password");
      return;
    }

    setCreatedPassword(data.password ?? "");
    setForm(EMPTY_FORM);
    setStatus("Password created. Copy it now; it will not be shown again.");
    await loadPasswords();
  }

  async function updatePassword(record: UnlockPassword) {
    const label = window.prompt("Password label", record.label);
    if (label === null) return;
    const expiry = window.prompt(
      "End date (YYYY-MM-DD), or leave empty for never",
      dateForInput(record.expiresAt)
    );
    if (expiry === null) return;

    let expiresAt: string | null;
    try {
      expiresAt = endOfDayIso(expiry);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid expiration");
      return;
    }

    const response = await fetch(`/admin/unlock-passwords/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, expiresAt }),
    });
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setStatus(data.error ?? "Unable to update password");
      return;
    }
    setStatus("Password updated");
    await loadPasswords();
  }

  async function revokePassword(record: UnlockPassword) {
    if (!window.confirm(`Revoke "${record.label}"?`)) return;
    const response = await fetch(`/admin/unlock-passwords/${record.id}/revoke`, {
      method: "POST",
    });
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setStatus(data.error ?? "Unable to revoke password");
      return;
    }
    setStatus("Password revoked");
    await loadPasswords();
  }

  async function deletePassword(record: UnlockPassword) {
    if (!window.confirm(`Delete "${record.label}" permanently?`)) return;
    const response = await fetch(`/admin/unlock-passwords/${record.id}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setStatus(data.error ?? "Unable to delete password");
      return;
    }
    setStatus("Password deleted");
    await loadPasswords();
  }

  return (
    <main className="app-page admin-container">
      <div className="page-header">
        <h1>Admin</h1>
        <Link className="admin-link" to="/">Back to<br />doors</Link>
      </div>

      <form className="admin-form" onSubmit={createPassword}>
        <h2>Create unlock password</h2>
        <input
          aria-label="Label"
          placeholder="Label (for example: Weekend guests)"
          value={form.label}
          onChange={(event) => setForm({ ...form, label: event.target.value })}
          required
          maxLength={100}
        />
        <input
          aria-label="Password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <label>
          End date (leave empty for never)
          <input
            aria-label="End date"
            type="date"
            value={form.expiresOn}
            onChange={(event) => setForm({ ...form, expiresOn: event.target.value })}
          />
        </label>
        <button className="btn-open" type="submit">Create password</button>
      </form>

      {createdPassword && (
        <div className="created-password" role="status">
          <strong>New password:</strong> <code>{createdPassword}</code>
        </div>
      )}
      {status && <div className="status-message" role="status">{status}</div>}

      <h2 className="passwords-heading">Active passwords</h2>
      {loading ? <p>Loading...</p> : (
        <div className="password-list">
          {passwords.length === 0 && <p>No unlock passwords created yet.</p>}
          {passwords.map((record) => (
            <article className={`password-card ${record.active ? "" : "inactive"}`} key={record.id}>
              <div>
                <h3>{record.label}</h3>
                <p>Created: {formatDate(record.createdAt)}</p>
                <p>Expires: {formatDate(record.expiresAt)}</p>
                <span className={`password-status ${record.active ? "active" : "inactive"}`}>
                  {record.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="password-actions">
                <button type="button" onClick={() => updatePassword(record)}>Edit</button>
                {record.active && (
                  <button type="button" className="danger-button" onClick={() => revokePassword(record)}>
                    Revoke
                  </button>
                )}
                <button type="button" className="danger-button" onClick={() => deletePassword(record)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
