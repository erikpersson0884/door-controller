const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const fs = require("node:fs");
const path = require("path");
const app = express();
const dotenv = require("dotenv");
const { initializeDatabase } = require("./db/database");
const {
  findActivePassword,
  hashPassword,
  normalizeExpiry,
  publicPassword,
} = require("./auth/passwords");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, "..", "client", "dist");

const environment = process.env;
const ENVS = [
  "UNLOCK_URL",
  "DOORS",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "SESSION_SECRET",
  "NODE_ENV",
  "UNLOCK_PASSWORD_DB_PATH",
];

for (const env of ENVS) {
  // Try to load environment from file
  const fileEnv = env + "_FILE";
  const filePath = environment[fileEnv];
  if (filePath) {
    try {
      environment[env] = fs.readFileSync(filePath, "utf8").trim();
    } catch (error) {
      console.error(`Failed to read file for environment ${fileEnv}:`, error);
      process.exit(1);
    }
  }

  if (!environment[env]) {
    console.error(`Missing required environment variable: ${env}`);
    process.exit(1);
  }
}

const database = initializeDatabase(process.env.UNLOCK_PASSWORD_DB_PATH);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(session({
  secret: environment.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: (environment.NODE_ENV || "").toLowerCase() === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// API auth: always JSON 401, never a redirect. React handles navigation.
function requireAuth(req, res, next) {
  if (req.session?.doorLoggedIn) return next();
  return res.status(401).json({ ok: false, error: "Not authenticated" });
}

function requireAdmin(req, res, next) {
  if (!req.session?.adminLoggedIn) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }
  return next();
}

function readPasswordInput(body) {
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (label.length < 1 || label.length > 100) {
    return { error: "Label must contain between 1 and 100 characters" };
  }
  if (password.length < 1) {
    return { error: "Password is required" };
  }

  let expiresAt;
  try {
    expiresAt = normalizeExpiry(body.expiresAt);
  } catch (error) {
    return { error: error.message };
  }
  return { label, password, expiresAt };
}

function readPasswordUpdate(body) {
  const updates = {};
  if (body && Object.hasOwn(body, "label")) {
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (label.length < 1 || label.length > 100) {
      return { error: "Label must contain between 1 and 100 characters" };
    }
    updates.label = label;
  }
  if (body && Object.hasOwn(body, "expiresAt")) {
    try {
      updates.expiresAt = normalizeExpiry(body.expiresAt);
    } catch (error) {
      return { error: error.message };
    }
  }
  return { updates };
}

// --- Public API ---
app.post("/login", (req, res) => {
  const { password } = req.body;
  const unlockPassword = findActivePassword(database, password);
  if (unlockPassword) {
    req.session.doorLoggedIn = true;
    console.log("unlock password login success");
    return res.json({ ok: true });
  }
  console.log("Unsuccessful login attempt");
  return res.status(401).json({ ok: false, error: "Wrong password" });
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.adminLoggedIn = true;
    console.log("admin login success");
    return res.json({ ok: true });
  }
  console.log("Unsuccessful admin login attempt");
  return res.status(401).json({ ok: false, error: "Wrong username or password" });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// --- Protected API ---
// Parse DOORS="Name One,Name Two" into { 1: "Name One", 2: "Name Two", ... }
const DOORS = (environment.DOORS || "")
  .split(",")
  .map(name => name.trim())
  .filter(Boolean)
  .reduce((acc, name, index) => {
    acc[index + 1] = name;
    return acc;
  }, {});

async function triggerUnlock(epName) {
  const body = new URLSearchParams({ epName });

  const r = await fetch(environment.UNLOCK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: body.toString(),
    redirect: "manual",
  });

  const location = r.headers.get("location") || "";
  const success = r.status === 302 && location.includes("IsError=False");

  return { ok: success, status: r.status, location };
}

app.get("/auth/check", requireAuth, (req, res) =>
  res.json({ ok: true })
);

app.get("/admin/auth/check", requireAdmin, (req, res) =>
  res.json({ ok: true })
);

app.get("/doors", requireAuth, (req, res) => {
  const list = Object.entries(DOORS).map(([id, name]) => ({ id, name }));
  res.json(list);
});

app.post("/trigger/:doorId", requireAuth, async (req, res) => {
  const epName = DOORS[req.params.doorId];
  if (!epName) {
    return res.status(400).json({ ok: false, error: `unknown door id: ${req.params.doorId}` });
  }
  try {
    res.json(await triggerUnlock(epName));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/admin/unlock-passwords", requireAdmin, (req, res) => {
  const records = database
    .prepare("SELECT * FROM unlock_passwords ORDER BY created_at DESC")
    .all()
    .map((record) => publicPassword(record));
  res.json({ passwords: records });
});

app.post("/admin/unlock-passwords", requireAdmin, (req, res) => {
  const input = readPasswordInput(req.body);
  if (input.error) {
    return res.status(400).json({ ok: false, error: input.error });
  }

  const now = new Date().toISOString();
  const result = database
    .prepare(`
      INSERT INTO unlock_passwords
        (label, password_hash, expires_at, revoked_at, created_at, updated_at)
      VALUES (?, ?, ?, NULL, ?, ?)
    `)
    .run(input.label, hashPassword(input.password), input.expiresAt, now, now);
  const created = database
    .prepare("SELECT * FROM unlock_passwords WHERE id = ?")
    .get(Number(result.lastInsertRowid));

  return res.status(201).json({
    ok: true,
    password: input.password,
    record: publicPassword(created),
  });
});

app.patch("/admin/unlock-passwords/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "Invalid password id" });
  }

  const input = readPasswordUpdate(req.body);
  if (input.error) {
    return res.status(400).json({ ok: false, error: input.error });
  }
  const fields = Object.keys(input.updates);
  if (fields.length === 0) {
    return res.status(400).json({ ok: false, error: "No changes supplied" });
  }

  const current = database
    .prepare("SELECT * FROM unlock_passwords WHERE id = ?")
    .get(id);
  if (!current) {
    return res.status(404).json({ ok: false, error: "Password not found" });
  }

  const now = new Date().toISOString();
  const label = input.updates.label ?? current.label;
  const expiresAt = Object.hasOwn(input.updates, "expiresAt")
    ? input.updates.expiresAt
    : current.expires_at;
  database
    .prepare(`
      UPDATE unlock_passwords
      SET label = ?, expires_at = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(label, expiresAt, now, id);

  const updated = database
    .prepare("SELECT * FROM unlock_passwords WHERE id = ?")
    .get(id);
  return res.json({ ok: true, record: publicPassword(updated) });
});

app.post("/admin/unlock-passwords/:id/revoke", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "Invalid password id" });
  }

  const now = new Date().toISOString();
  const result = database
    .prepare(`
      UPDATE unlock_passwords
      SET revoked_at = COALESCE(revoked_at, ?), updated_at = ?
      WHERE id = ?
    `)
    .run(now, now, id);
  if (result.changes === 0) {
    return res.status(404).json({ ok: false, error: "Password not found" });
  }

  const revoked = database
    .prepare("SELECT * FROM unlock_passwords WHERE id = ?")
    .get(id);
  return res.json({ ok: true, record: publicPassword(revoked) });
});

app.delete("/admin/unlock-passwords/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "Invalid password id" });
  }

  const result = database
    .prepare("DELETE FROM unlock_passwords WHERE id = ?")
    .run(id);
  if (result.changes === 0) {
    return res.status(404).json({ ok: false, error: "Password not found" });
  }
  return res.json({ ok: true });
});

// --- React app (public: contains no secrets, and the login page needs it) ---
app.use(express.static(DIST));

// SPA fallback: /login, / etc. all get index.html and React Router decides
app.use((req, res, next) => {
  if (req.method === "GET" && req.accepts("html")) {
    return res.sendFile(path.join(DIST, "index.html"));
  }
  next();
});

function link(text, url) {
  return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
}

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`door-app listening on ${link(url, url)}`);
});
