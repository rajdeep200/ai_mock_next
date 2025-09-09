// lib/cryptoSimple.ts
const isServer = typeof window === "undefined";

/* base64 ⇄ bytes */
function b64ToBytes(b64: string): Uint8Array {
  const s = String(b64 || "");
  if (isServer) return new Uint8Array(Buffer.from(s, "base64"));
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(bytes: Uint8Array): string {
  if (isServer) return Buffer.from(bytes).toString("base64");
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/* ✅ ALWAYS pass ArrayBuffer to Web Crypto to avoid TS BufferSource errors */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

/** Encrypt any JSON-serializable object with AES-256-GCM. Returns { iv, data } (both base64). */
export async function encrypt(obj: unknown, base64Key: string): Promise<{ iv: string; data: string }> {
  const keyBytes = b64ToBytes(base64Key);
  if (keyBytes.length !== 32) throw new Error("Key must be 32 bytes (base64-encoded)");

  const ivBytes = (crypto as Crypto).getRandomValues(new Uint8Array(12));
  const cryptoKey = await (crypto as Crypto).subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),                 // 👈 fix: ArrayBuffer
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const plaintext = new TextEncoder().encode(JSON.stringify(obj));
  const encBuf = await (crypto as Crypto).subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ivBytes) }, // 👈 fix: ArrayBuffer
    cryptoKey,
    toArrayBuffer(plaintext)                          // 👈 fix: ArrayBuffer
  );

  return {
    iv: bytesToB64(ivBytes),
    data: bytesToB64(new Uint8Array(encBuf)),         // ciphertext+tag
  };
}

/** Decrypt { iv, data } back into the original object. */
export async function decrypt<T = any>(blob: { iv: string; data: string }, base64Key: string): Promise<T> {
  const keyBytes = b64ToBytes(base64Key);
  if (keyBytes.length !== 32) throw new Error("Key must be 32 bytes (base64-encoded)");

  const ivBytes = b64ToBytes(blob.iv);
  const dataBytes = b64ToBytes(blob.data);

  const cryptoKey = await (crypto as Crypto).subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),                 // 👈 fix: ArrayBuffer
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decBuf = await (crypto as Crypto).subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(ivBytes) }, // 👈 fix: ArrayBuffer
    cryptoKey,
    toArrayBuffer(dataBytes)                          // 👈 fix: ArrayBuffer
  );

  return JSON.parse(new TextDecoder().decode(decBuf)) as T;
}
