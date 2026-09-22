import { describe, expect, it } from 'vitest';
import { createLogger } from './logger';
import { getRequestId } from './request';

describe('request correlation and safe logging', () => {
  it('accepts a safe incoming request ID and generates one otherwise', () => {
    expect(getRequestId({ 'x-request-id': 'req-123' })).toBe('req-123');
    expect(getRequestId({ 'x-request-id': 'bad value with spaces' })).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('redacts secrets and limits structured output', () => {
    const lines: string[] = [];
    const logger = createLogger('req-1', { info: value => lines.push(value), warn: value => lines.push(value), error: value => lines.push(value) });
    logger.info('test', { token: 'secret', nested: { password: 'hidden' } });
    expect(lines[0]).not.toContain('secret');
    expect(lines[0]).toContain('[redacted]');
  });
});
