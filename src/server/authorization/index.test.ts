import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  AuthorizationError,
  permissionsForRole,
  requirePlatformAdmin,
  resolveSchoolContext,
  withSchoolScope,
} from './index';
import { PERMISSIONS } from './permissions';

const account = (platformRole: 'PLATFORM_ADMIN' | null = null) =>
  Promise.resolve({
    identity: {} as never,
    profile: { id: 'user-a', platformRole },
  } as never);

const db = (schoolStatus = 'ACTIVE', membership: { id: string; role: 'SCHOOL_OWNER' | 'SCHOOL_ADMIN'; status?: string } | null = { id: 'membership-a', role: 'SCHOOL_OWNER' }) => ({
  school: { findUnique: async () => ({ id: 'school-a', slug: 'school-a', status: schoolStatus }) },
  schoolMembership: { findFirst: async () => membership?.status === 'SUSPENDED' ? null : membership },
});

describe('Module 04 RBAC', () => {
  it('maps owner/admin to the complete V1 permission surface', () => {
    expect(permissionsForRole('SCHOOL_OWNER')).toContain(PERMISSIONS.FEES_PAYMENTS_MANAGE);
    expect(permissionsForRole('SCHOOL_ADMIN')).toContain(PERMISSIONS.ID_CARDS_MANAGE);
    expect(permissionsForRole('STUDENT')).not.toContain(PERMISSIONS.SCHOOL_SETTINGS_MANAGE);
  });

  it('cannot resolve a suspended membership', async () => {
    await expect(resolveSchoolContext({ slug: 'school-a', getAccount: () => account(), db: db('ACTIVE', { id: 'm', role: 'SCHOOL_OWNER', status: 'SUSPENDED' }) })).rejects.toMatchObject({ code: 'SCHOOL_MEMBERSHIP_REQUIRED' });
  });

  it('cannot resolve an unavailable school', async () => {
    await expect(resolveSchoolContext({ slug: 'school-a', getAccount: () => account(), db: db('SUSPENDED') })).rejects.toMatchObject({ code: 'SCHOOL_UNAVAILABLE' });
  });

  it('does not turn a school A membership into school B access', async () => {
    const schoolB = {
      school: { findUnique: async () => ({ id: 'school-b', slug: 'school-b', status: 'ACTIVE' }) },
      schoolMembership: { findFirst: async () => null },
    };
    await expect(resolveSchoolContext({ slug: 'school-b', getAccount: () => account(), db: schoolB })).rejects.toMatchObject({ code: 'SCHOOL_MEMBERSHIP_REQUIRED' });
  });

  it('exposes a typed authorization error for callers', () => {
    expect(new AuthorizationError('PLATFORM_ADMIN_REQUIRED')).toBeInstanceOf(Error);
  });

  it('allows platform admins and denies school admins on platform routes', async () => {
    await expect(requirePlatformAdmin(() => account('PLATFORM_ADMIN'))).resolves.toBeDefined();
    await expect(requirePlatformAdmin(() => account())).rejects.toMatchObject({ code: 'PLATFORM_ADMIN_REQUIRED' });
  });

  it('requires context before applying a tenant repository scope', () => {
    const context = {
      schoolId: 'school-a',
      schoolSlug: 'school-a',
      userId: 'user-a',
      membershipId: 'membership-a',
      role: 'SCHOOL_OWNER' as const,
      permissions: permissionsForRole('SCHOOL_OWNER'),
    };
    expect(withSchoolScope(context, { status: 'ACTIVE' })).toEqual({ status: 'ACTIVE', schoolId: 'school-a' });
    expect(() => withSchoolScope({ ...context, schoolId: '' }, {})).toThrow('SCHOOL_MEMBERSHIP_REQUIRED');
  });
});
