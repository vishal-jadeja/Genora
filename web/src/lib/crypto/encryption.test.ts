import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

beforeEach(() => {
  vi.resetModules();
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips plaintext", async () => {
    const { encryptSecret, decryptSecret } = await import("./encryption");
    const secret = encryptSecret("sk-ant-super-secret");
    expect(decryptSecret(secret)).toBe("sk-ant-super-secret");
  });

  it("uses a fresh iv/ciphertext on every call", async () => {
    const { encryptSecret } = await import("./encryption");
    const a = encryptSecret("same-plaintext");
    const b = encryptSecret("same-plaintext");
    expect(a.iv).not.toBe(b.iv);
    expect(a.encryptedKey).not.toBe(b.encryptedKey);
  });

  it("throws if the authTag has been tampered with", async () => {
    const { encryptSecret, decryptSecret } = await import("./encryption");
    const secret = encryptSecret("sk-ant-super-secret");
    const tamperedTag = Buffer.from(secret.authTag, "base64");
    tamperedTag[0] ^= 0xff;
    const tampered = { ...secret, authTag: tamperedTag.toString("base64") };
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws if the ciphertext has been tampered with", async () => {
    const { encryptSecret, decryptSecret } = await import("./encryption");
    const secret = encryptSecret("sk-ant-super-secret");
    const tamperedCipher = Buffer.from(secret.encryptedKey, "base64");
    tamperedCipher[0] ^= 0xff;
    const tampered = {
      ...secret,
      encryptedKey: tamperedCipher.toString("base64"),
    };
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws at import time if ENCRYPTION_KEY is missing", async () => {
    delete process.env.ENCRYPTION_KEY;
    await expect(import("./encryption")).rejects.toThrow(
      "ENCRYPTION_KEY is not set",
    );
  });

  it("throws at import time if ENCRYPTION_KEY is the wrong length", async () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");
    await expect(import("./encryption")).rejects.toThrow(
      "ENCRYPTION_KEY must decode to exactly 32 bytes",
    );
  });
});
