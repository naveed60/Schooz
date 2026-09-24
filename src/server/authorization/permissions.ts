import type { MembershipRole } from '@prisma/client';

export const PERMISSIONS = {
  SCHOOL_SETTINGS_READ: 'school/settings:read',
  SCHOOL_SETTINGS_UPDATE: 'school/settings:update',
  SCHOOL_SETTINGS_MANAGE: 'school/settings:manage',
  STUDENTS_READ: 'students:read',
  STUDENTS_MANAGE: 'students:manage',
  TEACHERS_READ: 'teachers:read',
  TEACHERS_MANAGE: 'teachers:manage',
  ACADEMICS_READ: 'academics:read',
  ACADEMICS_MANAGE: 'academics:manage',
  EXAMS_READ: 'exams:read',
  EXAMS_MANAGE: 'exams:manage',
  RESULTS_MANAGE: 'results:manage',
  EXAMS_RESULTS_READ: 'exams/results:read',
  EXAMS_RESULTS_MANAGE: 'exams/results:manage',
  FEES_PAYMENTS_READ: 'fees/payments:read',
  FEES_PAYMENTS_MANAGE: 'fees/payments:manage',
  ID_CARDS_READ: 'id-card:read',
  ID_CARDS_MANAGE: 'id-card:manage',
} as const;

export type SchoolPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const allPermissions = Object.values(PERMISSIONS) as SchoolPermission[];
const readOnlyPermissions = allPermissions.filter(permission =>
  permission.endsWith(':read')
);

export const ROLE_PERMISSIONS: Readonly<Record<MembershipRole, readonly SchoolPermission[]>> = {
  SCHOOL_OWNER: allPermissions,
  SCHOOL_ADMIN: allPermissions,
  TEACHER: [
    ...readOnlyPermissions,
    PERMISSIONS.TEACHERS_MANAGE,
    PERMISSIONS.ACADEMICS_MANAGE,
    PERMISSIONS.EXAMS_MANAGE,
    PERMISSIONS.RESULTS_MANAGE,
    PERMISSIONS.EXAMS_RESULTS_MANAGE,
  ],
  ACCOUNTANT: [
    ...readOnlyPermissions,
    PERMISSIONS.FEES_PAYMENTS_MANAGE,
  ],
  EXAM_CONTROLLER: [
    ...readOnlyPermissions,
    PERMISSIONS.EXAMS_RESULTS_MANAGE,
  ],
  RECEPTIONIST: [
    PERMISSIONS.SCHOOL_SETTINGS_READ,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.TEACHERS_READ,
    PERMISSIONS.ACADEMICS_READ,
    PERMISSIONS.EXAMS_RESULTS_READ,
    PERMISSIONS.FEES_PAYMENTS_READ,
    PERMISSIONS.ID_CARDS_READ,
  ],
  PARENT: [
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.ACADEMICS_READ,
    PERMISSIONS.EXAMS_RESULTS_READ,
    PERMISSIONS.FEES_PAYMENTS_READ,
    PERMISSIONS.ID_CARDS_READ,
  ],
  STUDENT: [
    PERMISSIONS.ACADEMICS_READ,
    PERMISSIONS.EXAMS_RESULTS_READ,
    PERMISSIONS.ID_CARDS_READ,
  ],
};

export function permissionsForRole(role: MembershipRole) {
  return ROLE_PERMISSIONS[role];
}
