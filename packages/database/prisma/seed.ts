import {
  PrismaClient,
  SchoolStatus,
  UserProfileStatus,
  MembershipRole,
  MembershipStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const demoUserId = '00000000-0000-4000-8000-000000000001';
const demoSchoolId = '00000000-0000-4000-8000-000000000002';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The development seed cannot run in production');
  }

  const user = await prisma.userProfile.upsert({
    where: { id: demoUserId },
    update: {},
    create: {
      id: demoUserId,
      email: 'demo@schooz.local',
      firstName: 'Demo',
      lastName: 'Administrator',
      status: UserProfileStatus.ACTIVE,
    },
  });

  const school = await prisma.school.upsert({
    where: { id: demoSchoolId },
    update: {},
    create: {
      id: demoSchoolId,
      name: 'Demo School',
      slug: 'demo-school',
      email: 'school@schooz.local',
      timezone: 'UTC',
      currencyCode: 'USD',
      countryCode: 'US',
      status: SchoolStatus.ACTIVE,
      approvedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  });

  await prisma.schoolMembership.upsert({
    where: { schoolId_userId: { schoolId: school.id, userId: user.id } },
    update: {},
    create: {
      schoolId: school.id,
      userId: user.id,
      role: MembershipRole.SCHOOL_OWNER,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  });
}

main()
  .catch(error => {
    console.error('Database seed failed', {
      message: error instanceof Error ? error.message : 'unknown error',
    });
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
