import crypto from "crypto";

function getEncryptionKey() {
  const key = process.env.WALLET_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("Missing WALLET_ENCRYPTION_KEY");
  }

  const keyBuffer = Buffer.from(key, "base64");

  if (keyBuffer.length !== 32) {
    throw new Error("WALLET_ENCRYPTION_KEY must be a 32-byte base64 key");
  }

  return keyBuffer;
}

export function encryptPrivateKey(privateKey: string) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encryptedPrivateKey = Buffer.concat([
    cipher.update(privateKey, "utf8"),
    cipher.final(),
  ]);

  const encryptionTag = cipher.getAuthTag();

  return {
    encryptedPrivateKey: encryptedPrivateKey.toString("base64"),
    encryptionIv: iv.toString("base64"),
    encryptionTag: encryptionTag.toString("base64"),
  };
}

export function decryptPrivateKey({
  encryptedPrivateKey,
  encryptionIv,
  encryptionTag,
}: {
  encryptedPrivateKey: string;
  encryptionIv: string;
  encryptionTag: string;
}) {
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encryptionIv, "base64")
  );

  decipher.setAuthTag(Buffer.from(encryptionTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPrivateKey, "base64")),
    decipher.final(),
  ]).toString("utf8");

  if (!decrypted.startsWith("0x")) {
    return `0x${decrypted}` as `0x${string}`;
  }

  return decrypted as `0x${string}`;
}
