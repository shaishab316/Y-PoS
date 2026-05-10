import { hashPassword, comparePassword } from './hash.helper';

describe('hashPassword', () => {
  it('should return a hashed string different from plain', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
  });

  it('should produce different hashes for same input', async () => {
    const hash1 = await hashPassword('password123');
    const hash2 = await hashPassword('password123');
    expect(hash1).not.toBe(hash2); //? bcrypt salt should produce different hashes for same input
  });
});

describe('comparePassword', () => {
  it('should return true for correct password', async () => {
    const hash = await hashPassword('password123');
    expect(await comparePassword('password123', hash)).toBe(true);
  });

  it('should return false for wrong password', async () => {
    const hash = await hashPassword('password123');
    expect(await comparePassword('wrongpassword', hash)).toBe(false);
  });
});
