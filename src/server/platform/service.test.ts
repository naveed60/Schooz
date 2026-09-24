import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

import { listPlatformApplications, getPlatformDashboard, approveApplication } from './service';

const admin = () => Promise.resolve({ profile: { id: 'admin-a', platformRole: 'PLATFORM_ADMIN' } } as never);
const normalUser = () => Promise.resolve({ profile: { id: 'user-a', platformRole: null } } as never);

describe('platform review and provisioning authorization', () => {
  it('denies non-platform users before querying review data', async () => {
    let queried = false;
    const db = { schoolApplication: { findMany: async () => { queried = true; return []; }, count: async () => 0 } } as never;
    await expect(listPlatformApplications({ getAccount: normalUser, db })).rejects.toMatchObject({ code: 'PLATFORM_ADMIN_REQUIRED' });
    expect(queried).toBe(false);
  });

  it('loads dashboard totals with one application count query', async () => {
    const applicationFindMany = vi.fn().mockResolvedValue([{ id: 'application-a' }]);
    const applicationGroupBy = vi.fn().mockResolvedValue([
      { status: 'DRAFT', _count: { _all: 2 } },
      { status: 'SUBMITTED', _count: { _all: 3 } },
      { status: 'UNDER_REVIEW', _count: { _all: 1 } },
    ]);
    const schoolFindMany = vi.fn().mockResolvedValue([{ id: 'school-a' }]);
    const schoolCount = vi.fn().mockResolvedValue(4);
    const db = {
      schoolApplication: { findMany: applicationFindMany, groupBy: applicationGroupBy },
      school: { findMany: schoolFindMany, count: schoolCount },
    } as never;

    const result = await getPlatformDashboard({ getAccount: admin, db });

    expect(result).toMatchObject({
      applicationCount: 6,
      submittedCount: 3,
      reviewCount: 1,
      schoolCount: 4,
      applications: [{ id: 'application-a' }],
      schools: [{ id: 'school-a' }],
    });
    expect(applicationFindMany).toHaveBeenCalledOnce();
    expect(applicationGroupBy).toHaveBeenCalledOnce();
    expect(schoolFindMany).toHaveBeenCalledOnce();
    expect(schoolCount).toHaveBeenCalledOnce();
  });

  it('provisions exactly once when approval is repeated', async () => {
    let status: 'UNDER_REVIEW' | 'APPROVED' = 'UNDER_REVIEW';
    let schoolCreates = 0;
    let membershipCreates = 0;
    const school = { id: 'school-a', slug: 'north-star-school-application' };
    const tx = {
      schoolApplication: {
        findUnique: async () => status === 'UNDER_REVIEW'
          ? { id: 'application-a', applicantUserId: 'user-a', schoolName: 'North Star School', legalName: null, registrationNumber: null, email: 'school@example.com', phone: '+923001234567', website: null, addressLine1: 'Main', addressLine2: null, city: 'Lahore', stateOrRegion: 'Punjab', postalCode: null, countryCode: 'PK', status }
          : { id: 'application-a', applicantUserId: 'user-a', schoolName: 'North Star School', legalName: null, registrationNumber: null, email: 'school@example.com', phone: '+923001234567', website: null, addressLine1: 'Main', addressLine2: null, city: 'Lahore', stateOrRegion: 'Punjab', postalCode: null, countryCode: 'PK', status },
        update: async () => { status = 'APPROVED'; return {}; },
      },
      school: {
        findUnique: async ({ where }: { where: { slug?: string; sourceApplicationId?: string } }) => where.sourceApplicationId ? (status === 'APPROVED' ? school : null) : null,
        create: async () => { schoolCreates += 1; return school; },
      },
      schoolMembership: { create: async () => { membershipCreates += 1; return { id: 'membership-a' }; } },
      notificationOutbox: { create: async () => ({ id: 'outbox-a' }) },
      auditLog: { create: async () => ({ id: 'audit-a' }) },
    };
    const db = { ...tx, $transaction: async (callback: (database: typeof tx) => Promise<unknown>) => callback(tx) } as never;

    const first = await approveApplication('application-a', admin, db);
    const second = await approveApplication('application-a', admin, db);
    expect(first).toMatchObject({ idempotent: false, school });
    expect(second).toMatchObject({ idempotent: true, school });
    expect(schoolCreates).toBe(1);
    expect(membershipCreates).toBe(1);
  });
});
