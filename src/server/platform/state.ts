import type { SchoolApplicationStatus } from '@prisma/client';
import { BusinessRuleError } from '../errors';

export function assertReviewTransition(
  current: SchoolApplicationStatus,
  next: 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'REJECTED' | 'APPROVED'
) {
  if (next === 'UNDER_REVIEW' && (current === 'UNDER_REVIEW' || current === 'SUBMITTED')) return;
  if (next === 'CHANGES_REQUESTED' && ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(current)) return;
  if (next === 'REJECTED' && ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(current)) return;
  if (next === 'APPROVED' && current === 'UNDER_REVIEW') return;
  throw new BusinessRuleError(`Cannot transition application from ${current} to ${next}.`);
}
