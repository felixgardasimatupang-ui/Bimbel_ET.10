import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

function deriveKey(password: string, salt: string, keylen = 64): Buffer {
  return scryptSync(password, salt, keylen);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = deriveKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, keyHex] = hash.split(':');
  if (!salt || !keyHex) return false;
  const key = deriveKey(password, salt);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (key.length !== keyBuf.length) return false;
  return timingSafeEqual(key, keyBuf);
}
