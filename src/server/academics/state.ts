import { ConflictError } from '../errors';

export type AcademicStatus = 'ACTIVE' | 'ARCHIVED';
export function assertAcademicStatusTransition(from: AcademicStatus, to: AcademicStatus) {
  if (from === to) return;
  if (!((from === 'ACTIVE' && to === 'ARCHIVED') || (from === 'ARCHIVED' && to === 'ACTIVE'))) {
    throw new ConflictError(`Cannot change academic record from ${from} to ${to}.`);
  }
}
