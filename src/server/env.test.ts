import { describe, expect, it } from 'vitest';
import { parseServerEnv } from './env-schema';

describe('server environment schema', () => {
  it('provides safe defaults for the foundation', () => {
    expect(parseServerEnv({})).toMatchObject({
      NODE_ENV: 'development',
      APP_URL: 'http://localhost:3000',
    });
  });

  it('rejects an invalid application URL', () => {
    expect(() => parseServerEnv({ APP_URL: 'not-a-url' })).toThrow();
  });
});
