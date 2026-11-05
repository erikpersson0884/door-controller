const assert = require("node:assert/strict");
const test = require("node:test");
const {
  findActivePassword,
  hashPassword,
  verifyPassword,
  isPasswordActive,
} = require("../auth/passwords");

test("hashPassword creates a verifiable salted hash", () => {
  const firstHash = hashPassword("correct horse battery staple");
  const secondHash = hashPassword("correct horse battery staple");

  assert.notEqual(firstHash, secondHash);
  assert.equal(verifyPassword("correct horse battery staple", firstHash), true);
  assert.equal(verifyPassword("wrong password", firstHash), false);
});

test("isPasswordActive supports revocation, expiry, and infinite lifetime", () => {
  const now = new Date("2026-11-05T12:00:00.000Z");

  assert.equal(isPasswordActive({ revoked_at: null, expires_at: null }, now), true);
  assert.equal(
    isPasswordActive(
      { revoked_at: null, expires_at: "2026-11-05T12:00:01.000Z" },
      now
    ),
    true
  );
  assert.equal(
    isPasswordActive(
      { revoked_at: null, expires_at: "2026-11-05T11:59:59.000Z" },
      now
    ),
    false
  );
  assert.equal(
    isPasswordActive(
      { revoked_at: "2026-11-05T11:00:00.000Z", expires_at: null },
      now
    ),
    false
  );
});

test("findActivePassword only returns matching, active records", () => {
  const hash = hashPassword("event-password");
  const database = {
    prepare() {
      return {
        all() {
          return [
            {
              id: 1,
              password_hash: hash,
              revoked_at: null,
              expires_at: null,
            },
            {
              id: 2,
              password_hash: hashPassword("expired-password"),
              revoked_at: null,
              expires_at: "2026-11-05T11:00:00.000Z",
            },
          ];
        },
      };
    },
  };

  assert.equal(
    findActivePassword(
      database,
      "event-password",
      new Date("2026-11-05T12:00:00.000Z")
    ).id,
    1
  );
  assert.equal(
    findActivePassword(
      database,
      "expired-password",
      new Date("2026-11-05T12:00:00.000Z")
    ),
    null
  );
});
