import crypto from "crypto";

function getEncryptionKey() {
  const key = process.env.WALLET_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("Missing WALLET_ENCRYPTION_KEY");
  }

  const keyBuffer = Buffer.from(key, "base64");

  if (keyBuffer.length !== 32) {
    throw new Error("WALLET_ENCRYPTION_KEY must be 32 bytes base64");
  }

  return keyBuffer;
}

export function encryptPrivateKey(privateKey: string) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    encryptedPrivateKey: encrypted.toString("base64"),
    encryptionIv: iv.toString("base64"),
    encryptionTag: tag.toString("base64"),
  };
}