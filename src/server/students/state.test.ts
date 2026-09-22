import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { assertEnrollmentStatusTransition } from './state';
describe('enrollment transitions', () => {
  it('allows active enrollment to complete or withdraw', () => { expect(() => assertEnrollmentStatusTransition('ACTIVE', 'COMPLETED')).not.toThrow(); expect(() => assertEnrollmentStatusTransition('ACTIVE', 'WITHDRAWN')).not.toThrow(); });
  it('does not reopen a completed enrollment', () => expect(() => assertEnrollmentStatusTransition('COMPLETED', 'ACTIVE')).toThrow());
});
