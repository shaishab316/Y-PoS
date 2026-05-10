import { createHash, randomBytes } from 'crypto';

export function generateNonceWithHash(length: number): {
  nonce: string;
  hash: string;
} {
  const nonce = randomBytes(length).toString('hex');

  const hash = hashNonce(nonce);

  return { nonce, hash };
}

export function hashNonce(nonce: string): string {
  return createHash('sha256').update(nonce).digest('hex');
}
