import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { assertAcademicStatusTransition } from './state';

describe('academic status transitions', () => {
  it('allows archive and reactivation', () => {
    expect(() => assertAcademicStatusTransition('ACTIVE', 'ARCHIVED')).not.toThrow();
    expect(() => assertAcademicStatusTransition('ARCHIVED', 'ACTIVE')).not.toThrow();
  });
  it('allows idempotent status writes', () => expect(() => assertAcademicStatusTransition('ACTIVE', 'ACTIVE')).not.toThrow());
});
