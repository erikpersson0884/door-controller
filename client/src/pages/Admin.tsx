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
  expiresAt: string;
};

const EMPTY_FORM: PasswordForm = { label: "", password: "", expiresAt: "" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Never";
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
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

    const response = await fetch("/admin/unlock-passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label,
        password: form.password,
        expiresAt: toIso(form.expiresAt),
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
      "Expiry as ISO timestamp, or leave empty for never",
      record.expiresAt ?? ""
    );
    if (expiry === null) return;

    const response = await fetch(`/admin/unlock-passwords/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, expiresAt: expiry || null }),
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
    <div className="container admin-container">
      <div className="page-header">
        <h1>Admin</h1>
        <Link className="text-link" to="/">Back to doors</Link>
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
          placeholder="Password (8-200 characters)"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
          minLength={8}
          maxLength={200}
        />
        <label>
          Expires (leave empty for never)
          <input
            aria-label="Expiry"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
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

      <h2>Unlock passwords</h2>
      {loading ? <p>Loading...</p> : (
        <div className="password-list">
          {passwords.length === 0 && <p>No unlock passwords created yet.</p>}
          {passwords.map((record) => (
            <article className={`password-card ${record.active ? "" : "inactive"}`} key={record.id}>
              <div>
                <h3>{record.label}</h3>
                <p>Created: {formatDate(record.createdAt)}</p>
                <p>Expires: {formatDate(record.expiresAt)}</p>
                <strong>{record.active ? "Active" : "Inactive"}</strong>
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
    </div>
  );
}
