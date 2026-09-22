import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

import { assertReviewTransition } from './state';

describe('platform application review transitions', () => {
  it('supports review, changes and rejection transitions', () => {
    expect(() => assertReviewTransition('SUBMITTED', 'UNDER_REVIEW')).not.toThrow();
    expect(() => assertReviewTransition('UNDER_REVIEW', 'CHANGES_REQUESTED')).not.toThrow();
    expect(() => assertReviewTransition('CHANGES_REQUESTED', 'REJECTED')).not.toThrow();
  });

  it('only approves applications under review', () => {
    expect(() => assertReviewTransition('UNDER_REVIEW', 'APPROVED')).not.toThrow();
    expect(() => assertReviewTransition('SUBMITTED', 'APPROVED')).toThrow('Cannot transition');
    expect(() => assertReviewTransition('APPROVED', 'REJECTED')).toThrow('Cannot transition');
  });
});
