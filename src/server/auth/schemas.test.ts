import { describe, expect, it } from 'vitest';
import { credentialsSchema, passwordResetSchema } from './schemas';

describe('authentication validation', () => {
  it('normalizes valid credential email input', () => {
    expect(
      credentialsSchema.parse({
        email: ' User@Example.COM ',
        password: 'password123',
      }).email
    ).toBe('user@example.com');
  });

  it('rejects mismatched password confirmation', () => {
    expect(() =>
      passwordResetSchema.parse({
        password: 'password123',
        confirmPassword: 'different123',
      })
    ).toThrow();
  });
});
