import { ConflictError } from '../errors';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN' | 'CANCELLED';
export function assertEnrollmentStatusTransition(from: EnrollmentStatus, to: EnrollmentStatus) {
  if (from === to) return;
  if (from === 'ACTIVE' && ['COMPLETED', 'WITHDRAWN', 'CANCELLED'].includes(to)) return;
  throw new ConflictError(`Cannot change enrollment from ${from} to ${to}.`);
}
