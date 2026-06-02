/**
 * Password hashing built on Web Crypto (PBKDF2 + SHA-256).
 *
 * Available in modern browsers and in React Native via
 * `react-native-quick-crypto` (drop-in `crypto.subtle` polyfill), so the
 * same code paths work on mobile.
 */

const ITERATIONS = 150_000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(value: string): Uint8Array {
  const bin = atob(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export class InsecureContextError extends Error {
  constructor() {
    super(
      'Esta conexão não é segura (HTTP). Para login e instalação acesse o app via https:// ou pelo localhost do seu PC.',
    );
    this.name = 'InsecureContextError';
  }
}

async function derive(password: string, salt: Uint8Array): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new InsecureContextError();
  }
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS,
  );
  return toBase64(new Uint8Array(bits));
}

export interface HashedPassword {
  hash: string;
  salt: string;
}

/** Hashes a plaintext password. Returns base64 hash and salt to store. */
export async function hashPassword(password: string): Promise<HashedPassword> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt);
  return { hash, salt: toBase64(salt) };
}

/** Verifies a plaintext password against a stored hash/salt pair. */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  const candidate = await derive(password, fromBase64(salt));
  return constantTimeEqual(candidate, hash);
}
