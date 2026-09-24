import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
  getUser: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@schooz/database', () => ({
  prisma: { userProfile: { findUnique: mocks.findUnique, upsert: mocks.upsert } },
}));
vi.mock('./supabase-server', () => ({
  createSupabaseServerClient: async () => ({ auth: { getClaims: mocks.getClaims, getUser: mocks.getUser } }),
}));

import { requireAuthenticatedClaimsUser } from './profile';

describe('server profile authentication', () => {
  beforeEach(() => vi.resetAllMocks());

  it('uses a verified token subject and a fresh database profile without fetching the Auth user', async () => {
    const profile = { id: 'user-a', platformRole: 'PLATFORM_ADMIN', status: 'ACTIVE' };
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: 'user-a' } }, error: null });
    mocks.findUnique.mockResolvedValue(profile);

    await expect(requireAuthenticatedClaimsUser()).resolves.toEqual({ profile });
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-a' } }));
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('rejects an invalid token before reading the profile', async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: new Error('invalid token') });

    await expect(requireAuthenticatedClaimsUser()).rejects.toThrow('UNAUTHENTICATED');
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a mismatched Auth user when creating a missing profile', async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: 'user-a' } }, error: null });
    mocks.findUnique.mockResolvedValue(null);
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-b' } }, error: null });

    await expect(requireAuthenticatedClaimsUser()).rejects.toThrow('UNAUTHENTICATED');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
