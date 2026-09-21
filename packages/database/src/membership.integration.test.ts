import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

const integrationEnabled = process.env.RUN_DATABASE_INTEGRATION === 'true';
const prisma = new PrismaClient();

describe.skipIf(!integrationEnabled)('database membership constraints', () => {
  it('allows cross-school membership and rejects duplicate same-school membership', async () => {
    const userId = randomUUID();
    const schoolAId = randomUUID();
    const schoolBId = randomUUID();

    try {
      await prisma.userProfile.create({
        data: {
          id: userId,
          email: `${userId}@integration.test`,
          firstName: 'Integration',
          lastName: 'User',
        },
      });
      await prisma.school.createMany({
        data: [
          {
            id: schoolAId,
            name: 'Integration School A',
            slug: `integration-a-${userId.slice(0, 8)}`,
            email: 'a@integration.test',
            timezone: 'UTC',
            currencyCode: 'USD',
            countryCode: 'US',
          },
          {
            id: schoolBId,
            name: 'Integration School B',
            slug: `integration-b-${userId.slice(0, 8)}`,
            email: 'b@integration.test',
            timezone: 'UTC',
            currencyCode: 'USD',
            countryCode: 'US',
          },
        ],
      });
      await prisma.schoolMembership.createMany({
        data: [
          { schoolId: schoolAId, userId, role: 'STAFF' },
          { schoolId: schoolBId, userId, role: 'STAFF' },
        ],
      });

      await expect(
        prisma.schoolMembership.create({
          data: { schoolId: schoolAId, userId, role: 'ADMIN' },
        })
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await prisma.schoolMembership.deleteMany({ where: { userId } });
      await prisma.school.deleteMany({
        where: { id: { in: [schoolAId, schoolBId] } },
      });
      await prisma.userProfile.deleteMany({ where: { id: userId } });
      await prisma.$disconnect();
    }
  });
});
