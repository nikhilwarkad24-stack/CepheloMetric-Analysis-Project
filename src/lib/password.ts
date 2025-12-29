import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64);
  return { salt, hash: derived.toString('hex') };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const derived = scryptSync(password, salt, 64);
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), derived);
  } catch (e) {
    return false;
  }
}
