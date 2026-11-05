const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { initializeDatabase } = require("../db/database");

test("initializeDatabase creates the unlock password table and persists data", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "door-controller-"));
  const databasePath = path.join(directory, "data.sqlite");

  try {
    const database = initializeDatabase(databasePath);
    database
      .prepare(`
        INSERT INTO unlock_passwords
          (label, password_hash, expires_at, revoked_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        "Event password",
        "scrypt$16384$8$1$salt$key",
        null,
        null,
        "2026-11-05T12:00:00.000Z",
        "2026-11-05T12:00:00.000Z"
      );
    database.close();

    const reopened = initializeDatabase(databasePath);
    const record = reopened
      .prepare("SELECT label, expires_at FROM unlock_passwords")
      .get();
    reopened.close();

    assert.deepEqual({ ...record }, {
      label: "Event password",
      expires_at: null,
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
