import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../audit', () => ({ auditService: { append: vi.fn().mockResolvedValue({}) } }));

import { updateSchoolSettings } from './service';

const context = { schoolId: 'school-a', schoolSlug: 'school-a', userId: 'user-a', membershipId: 'membership-a', role: 'SCHOOL_OWNER' as const, permissions: ['school/settings:read', 'school/settings:update'] as const };

describe('tenant school settings', () => {
  it('updates only explicit settings fields and records the school scope', async () => {
    let update: Record<string, unknown> | undefined;
    let updateWhere: Record<string, unknown> | undefined;
    const db = { school: {
      findUnique: async () => ({ id: 'school-a', name: 'School A', slug: 'school-a', legalName: null, registrationNumber: null, email: 'a@example.com', phone: '1234567', website: null, logoStorageKey: null, addressLine1: 'Main', addressLine2: null, city: 'Lahore', stateOrRegion: 'Punjab', postalCode: null, countryCode: 'PK', timezone: 'UTC', currencyCode: 'USD', dateFormat: 'YYYY-MM-DD', studentNumberPrefix: null, invoiceNumberPrefix: null, status: 'ACTIVE' }),
      update: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => { updateWhere = where; update = data; return { id: 'school-a', name: 'School A', ...data }; },
    } } as never;
    await updateSchoolSettings(context, { timezone: 'Asia/Karachi', currencyCode: 'PKR', dateFormat: 'DD/MM/YYYY', studentNumberPrefix: 'STU', invoiceNumberPrefix: undefined }, db);
    expect(update).toEqual({ timezone: 'Asia/Karachi', currencyCode: 'PKR', dateFormat: 'DD/MM/YYYY', studentNumberPrefix: 'STU', invoiceNumberPrefix: undefined });
    expect(update).not.toHaveProperty('status');
    expect(update).not.toHaveProperty('approvedAt');
    expect(updateWhere).toEqual({ id: 'school-a' });
  });

  it('denies a member without settings update permission', async () => {
    const readOnly = { ...context, permissions: ['school/settings:read'] as const };
    await expect(updateSchoolSettings(readOnly, { timezone: 'UTC', currencyCode: 'USD', dateFormat: 'YYYY-MM-DD' }, {} as never)).rejects.toMatchObject({ code: 'SCHOOL_PERMISSION_REQUIRED' });
  });
});
