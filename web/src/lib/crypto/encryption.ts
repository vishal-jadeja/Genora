import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function loadKey(envVar: string, raw: string | undefined): Buffer {
  if (!raw) {
    throw new Error(`${envVar} is not set`);
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== KEY_LENGTH) {
    throw new Error(
      `${envVar} must decode to exactly ${KEY_LENGTH} bytes (base64-encoded)`,
    );
  }
  return buf;
}

const key = loadKey("ENCRYPTION_KEY", process.env.ENCRYPTION_KEY);
// Optional: set during a key rotation so rows encrypted under the old key
// keep decrypting until they're naturally re-saved under the new one. Drop
// this env var once rotation is complete.
const previousKey = process.env.ENCRYPTION_KEY_PREVIOUS
  ? loadKey("ENCRYPTION_KEY_PREVIOUS", process.env.ENCRYPTION_KEY_PREVIOUS)
  : undefined;

export interface EncryptedSecret {
  encryptedKey: string;
  iv: string;
  authTag: string;
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return {
    encryptedKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptWith(key: Buffer, payload: EncryptedSecret): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedKey, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function decryptSecret(payload: EncryptedSecret): string {
  try {
    return decryptWith(key, payload);
  } catch (err) {
    if (previousKey) {
      return decryptWith(previousKey, payload);
    }
    throw err;
  }
}
