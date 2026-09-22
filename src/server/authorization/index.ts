import 'server-only';

import type { MembershipRole } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@schooz/database';
import { requireAuthenticatedUser } from '../auth/profile';
import {
  type SchoolPermission,
  permissionsForRole,
} from './permissions';

export { PERMISSIONS, ROLE_PERMISSIONS, permissionsForRole } from './permissions';
export type { SchoolPermission } from './permissions';

export class AuthorizationError extends Error {
  constructor(
    public readonly code:
      | 'UNAUTHENTICATED'
      | 'PLATFORM_ADMIN_REQUIRED'
      | 'SCHOOL_NOT_FOUND'
      | 'SCHOOL_UNAVAILABLE'
      | 'SCHOOL_MEMBERSHIP_REQUIRED'
      | 'SCHOOL_PERMISSION_REQUIRED'
  ) {
    super(code);
    this.name = 'AuthorizationError';
  }
}

export type SchoolContext = {
  schoolId: string;
  schoolSlug: string;
  schoolName?: string;
  userId: string;
  membershipId: string;
  role: MembershipRole;
  permissions: readonly SchoolPermission[];
};

type AuthAccount = Awaited<ReturnType<typeof requireAuthenticatedUser>>;
type AuthorizationDb = {
  school: {
    findUnique(args: {
      where: { slug: string };
      select: { id: true; slug: true; name?: true; status: true };
    }): Promise<{ id: string; slug: string; name?: string; status: string } | null>;
  };
  schoolMembership: {
    findFirst(args: {
      where: { schoolId: string; userId: string; status: 'ACTIVE' };
      select: { id: true; role: true };
    }): Promise<{ id: string; role: MembershipRole } | null>;
  };
};

export async function requirePlatformAdmin(
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser
) {
  let account: AuthAccount;
  try {
    account = await getAccount();
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    throw new AuthorizationError('UNAUTHENTICATED');
  }

  if (account.profile.platformRole !== 'PLATFORM_ADMIN') {
    throw new AuthorizationError('PLATFORM_ADMIN_REQUIRED');
  }
  return account;
}

export async function resolveSchoolContext({
  slug,
  getAccount = requireAuthenticatedUser,
  db = prisma,
}: {
  slug: string;
  getAccount?: () => Promise<AuthAccount>;
  db?: AuthorizationDb;
}): Promise<SchoolContext> {
  let account: AuthAccount;
  try {
    account = await getAccount();
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    throw new AuthorizationError('UNAUTHENTICATED');
  }

  const school = await db.school.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, status: true },
  });
  if (!school) throw new AuthorizationError('SCHOOL_NOT_FOUND');
  if (school.status !== 'ACTIVE') {
    throw new AuthorizationError('SCHOOL_UNAVAILABLE');
  }

  const membership = await db.schoolMembership.findFirst({
    where: {
      schoolId: school.id,
      userId: account.profile.id,
      status: 'ACTIVE',
    },
    select: { id: true, role: true },
  });
  if (!membership) throw new AuthorizationError('SCHOOL_MEMBERSHIP_REQUIRED');

  return {
    schoolId: school.id,
    schoolSlug: school.slug,
    schoolName: school.name,
    userId: account.profile.id,
    membershipId: membership.id,
    role: membership.role,
    permissions: permissionsForRole(membership.role),
  };
}

/** Request-level composition lets the tenant layout and child page share one context lookup. */
export const resolveSchoolContextCached = cache((slug: string) =>
  resolveSchoolContext({ slug })
);

export function requireSchoolMembership(context: SchoolContext) {
  if (!context.schoolId || !context.userId || !context.membershipId) {
    throw new AuthorizationError('SCHOOL_MEMBERSHIP_REQUIRED');
  }
  return context;
}

export function requireSchoolPermission(
  context: SchoolContext,
  permission: SchoolPermission
) {
  requireSchoolMembership(context);
  if (!context.permissions.includes(permission)) {
    throw new AuthorizationError('SCHOOL_PERMISSION_REQUIRED');
  }
  return context;
}

/** Add tenant scope to every repository predicate; callers cannot omit schoolId. */
export function withSchoolScope<T extends object>(
  context: SchoolContext,
  where: T
): Omit<T, 'schoolId'> & { schoolId: string } {
  requireSchoolMembership(context);
  return { ...where, schoolId: context.schoolId };
}
