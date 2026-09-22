import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  NotFoundError,
  ValidationError,
  toSafeErrorResponse,
} from './index';

describe('safe application errors', () => {
  it('maps known errors without exposing implementation details', () => {
    expect(toSafeErrorResponse(new ValidationError('Bad email'))).toEqual({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Bad email' },
    });
  });

  it('hides raw database messages and stacks', () => {
    const result = toSafeErrorResponse(
      new Error('Prisma password=super-secret stack at /private/path')
    );
    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
    expect(JSON.stringify(result)).not.toContain('super-secret');
  });

  it('preserves safe domain status codes', () => {
    expect(new NotFoundError().status).toBe(404);
  });
});
