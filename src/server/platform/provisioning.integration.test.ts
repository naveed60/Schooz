import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

import { approveApplication } from './service';

const enabled = process.env.RUN_DATABASE_INTEGRATION === 'true';
const prisma = new PrismaClient();

describe.skipIf(!enabled)('platform provisioning integration', () => {
  it('creates one school and one active owner membership across repeated approval', async () => {
    const adminId = randomUUID();
    const applicantId = randomUUID();
    const applicationId = randomUUID();
    try {
      await prisma.userProfile.createMany({ data: [
        { id: adminId, email: `${adminId}@integration.test`, firstName: 'Platform', lastName: 'Admin', platformRole: 'PLATFORM_ADMIN', status: 'ACTIVE' },
        { id: applicantId, email: `${applicantId}@integration.test`, firstName: 'Applicant', lastName: 'Owner', status: 'ACTIVE' },
      ] });
      await prisma.schoolApplication.create({
        data: {
          id: applicationId, applicantUserId: applicantId, schoolName: 'Provision Integration School', schoolType: 'PRIVATE',
          email: 'school@integration.test', phone: '+923001234567', addressLine1: '1 Main Street', city: 'Lahore', stateOrRegion: 'Punjab', countryCode: 'PK', status: 'UNDER_REVIEW',
        },
      });
      const getAdmin = () => Promise.resolve({ profile: { id: adminId, platformRole: 'PLATFORM_ADMIN' } } as never);
      const first = await approveApplication(applicationId, getAdmin, prisma);
      const second = await approveApplication(applicationId, getAdmin, prisma);
      expect(first.idempotent).toBe(false);
      expect(second.idempotent).toBe(true);
      expect(await prisma.school.count({ where: { sourceApplicationId: applicationId } })).toBe(1);
      expect(await prisma.schoolMembership.count({ where: { userId: applicantId, role: 'SCHOOL_OWNER', status: 'ACTIVE' } })).toBe(1);
      expect(await prisma.schoolApplication.findUnique({ where: { id: applicationId }, select: { status: true } })).toEqual({ status: 'APPROVED' });
    } finally {
      await prisma.schoolApplication.deleteMany({ where: { id: applicationId } });
      await prisma.userProfile.deleteMany({ where: { id: { in: [adminId, applicantId] } } });
      await prisma.$disconnect();
    }
  });
});
