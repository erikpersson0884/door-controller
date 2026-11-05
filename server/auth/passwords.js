const crypto = require("node:crypto");

const HASH_ALGORITHM = "scrypt";
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);

  return [
    HASH_ALGORITHM,
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

function verifyPassword(password, encodedHash) {
  const [algorithm, n, r, p, encodedSalt, encodedKey] = encodedHash.split("$");
  if (
    algorithm !== HASH_ALGORITHM ||
    !encodedSalt ||
    !encodedKey ||
    !Number.isInteger(Number(n)) ||
    !Number.isInteger(Number(r)) ||
    !Number.isInteger(Number(p))
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(encodedSalt, "base64url");
    const expectedKey = Buffer.from(encodedKey, "base64url");
    const actualKey = crypto.scryptSync(password, salt, expectedKey.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 32 * 1024 * 1024,
    });

    return (
      expectedKey.length === actualKey.length &&
      crypto.timingSafeEqual(expectedKey, actualKey)
    );
  } catch {
    return false;
  }
}

function isPasswordActive(record, now = new Date()) {
  if (record.revoked_at) return false;
  if (!record.expires_at) return true;

  const expiresAt = new Date(record.expires_at);
  return !Number.isNaN(expiresAt.valueOf()) && expiresAt > now;
}

function normalizeExpiry(expiresAt) {
  if (expiresAt === null || expiresAt === undefined || expiresAt === "") {
    return null;
  }
  if (typeof expiresAt !== "string") {
    throw new Error("expiresAt must be an ISO timestamp or null");
  }

  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error("expiresAt must be a valid ISO timestamp");
  }
  return parsed.toISOString();
}

function publicPassword(record, now = new Date()) {
  return {
    id: record.id,
    label: record.label,
    expiresAt: record.expires_at,
    revokedAt: record.revoked_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    active: isPasswordActive(record, now),
  };
}

function findActivePassword(database, password, now = new Date()) {
  const records = database
    .prepare("SELECT * FROM unlock_passwords WHERE revoked_at IS NULL")
    .all();

  return records.find(
    (record) => isPasswordActive(record, now) && verifyPassword(password, record.password_hash)
  ) || null;
}

module.exports = {
  findActivePassword,
  hashPassword,
  isPasswordActive,
  normalizeExpiry,
  publicPassword,
  verifyPassword,
};
