/**
 * GhostWire Client-Side Cryptographic Vault
 * Zero-Knowledge client-side AES-256-GCM encryption using standard Web Crypto API.
 * The server NEVER sees the encryption key, plaintext, or raw PII.
 */

export interface EncryptedVaultPayload {
  ciphertextBase64: string;
  ivBase64: string;
  saltBase64: string;
  iterations: number;
  tagLength: number;
}

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a cryptographic AES-256-GCM key from a user passphrase using PBKDF2.
 */
async function deriveKey(passphrase: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary plaintext client-side with a passphrase.
 */
export async function encryptZeroKnowledge(
  plaintext: string,
  passphrase?: string
): Promise<{ payload: EncryptedVaultPayload; keyUsed: string }> {
  // If no passphrase provided, generate a random 32-character high-entropy secret key
  const key = passphrase || Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard IV for GCM
  const iterations = 100000;

  const cryptoKey = await deriveKey(key, salt, iterations);
  const enc = new TextEncoder();
  const encryptedBuf = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    cryptoKey,
    enc.encode(plaintext)
  );

  return {
    payload: {
      ciphertextBase64: bufferToBase64(encryptedBuf),
      ivBase64: bufferToBase64(iv.buffer),
      saltBase64: bufferToBase64(salt.buffer),
      iterations,
      tagLength: 128
    },
    keyUsed: key
  };
}

/**
 * Decrypts an EncryptedVaultPayload client-side using the passphrase.
 */
export async function decryptZeroKnowledge(
  payload: EncryptedVaultPayload,
  passphrase: string
): Promise<string> {
  const salt = base64ToBuffer(payload.saltBase64);
  const iv = base64ToBuffer(payload.ivBase64);
  const ciphertext = base64ToBuffer(payload.ciphertextBase64);

  const cryptoKey = await deriveKey(passphrase, salt, payload.iterations);
  const decryptedBuf = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any
    },
    cryptoKey,
    ciphertext as any
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuf);
}
