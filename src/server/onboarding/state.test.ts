import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { assertApplicantCanEdit, assertApplicantCanSubmit, canApplicantEdit } from './state';

describe('school application state transitions', () => {
  it('allows drafts and requested changes to be edited and submitted', () => {
    expect(canApplicantEdit('DRAFT')).toBe(true);
    expect(canApplicantEdit('CHANGES_REQUESTED')).toBe(true);
    expect(() => assertApplicantCanSubmit('DRAFT')).not.toThrow();
    expect(() => assertApplicantCanSubmit('CHANGES_REQUESTED')).not.toThrow();
  });

  it('locks submitted, reviewed, approved and rejected applications', () => {
    for (const status of ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const) {
      expect(canApplicantEdit(status)).toBe(false);
      expect(() => assertApplicantCanEdit(status)).toThrow('cannot be edited');
      expect(() => assertApplicantCanSubmit(status)).toThrow('can be submitted');
    }
  });
});
