import type { SchoolApplicationStatus } from '@prisma/client';
import { BusinessRuleError } from '../errors';

export const APPLICANT_EDITABLE_STATUSES: readonly SchoolApplicationStatus[] = [
  'DRAFT',
  'CHANGES_REQUESTED',
];

export function canApplicantEdit(status: SchoolApplicationStatus) {
  return APPLICANT_EDITABLE_STATUSES.includes(status);
}

export function assertApplicantCanEdit(status: SchoolApplicationStatus) {
  if (!canApplicantEdit(status)) {
    throw new BusinessRuleError('This application cannot be edited in its current state.');
  }
}

export function assertApplicantCanSubmit(status: SchoolApplicationStatus) {
  if (status !== 'DRAFT' && status !== 'CHANGES_REQUESTED') {
    throw new BusinessRuleError('Only draft or changes-requested applications can be submitted.');
  }
}
