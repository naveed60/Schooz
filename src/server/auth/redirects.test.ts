import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './redirects';

describe('safe auth redirects', () => {
  it('allows a local path', () => {
    expect(getSafeRedirectPath('/platform?tab=account')).toBe(
      '/platform?tab=account'
    );
  });

  it('rejects external and protocol-relative URLs', () => {
    expect(getSafeRedirectPath('https://evil.example')).toBe('/');
    expect(getSafeRedirectPath('//evil.example')).toBe('/');
  });
});
