import 'server-only';

import { prisma } from '@schooz/database';
import { Prisma, type SchoolApplicationStatus } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requirePlatformAdmin } from '../authorization';
import { requireAuthenticatedUser } from '../auth/profile';
import { auditService } from '../audit';
import { ConflictError, BusinessRuleError, NotFoundError } from '../errors';
import { createAuthorizedPrivateDownloadUrl } from '../storage';
import { assertReviewTransition } from './state';

type AuthAccount = Awaited<ReturnType<typeof requireAuthenticatedUser>>;
type PlatformDb = Pick<typeof prisma, 'schoolApplication' | 'schoolApplicationDocument' | 'school' | 'schoolMembership' | 'notificationOutbox' | '$transaction'>;
type Storage = { client: SupabaseClient; bucket: string };

const applicationReviewSelect = {
  id: true,
  applicantUserId: true,
  schoolName: true,
  legalName: true,
  registrationNumber: true,
  schoolType: true,
  email: true,
  phone: true,
  website: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  stateOrRegion: true,
  postalCode: true,
  countryCode: true,
  principalName: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewNotes: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  applicant: { select: { id: true, email: true, firstName: true, lastName: true } },
  documents: {
    select: { id: true, originalFileName: true, mimeType: true, sizeBytes: true, documentType: true, uploadedAt: true },
    orderBy: { uploadedAt: 'desc' as const },
  },
} satisfies Prisma.SchoolApplicationSelect;

const applicationListSelect = {
  id: true,
  schoolName: true,
  schoolType: true,
  countryCode: true,
  status: true,
  submittedAt: true,
  applicant: { select: { email: true, firstName: true, lastName: true } },
} satisfies Prisma.SchoolApplicationSelect;

async function requireAdmin(getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser) {
  return requirePlatformAdmin(getAccount);
}

export async function listPlatformApplications({
  status,
  page = 1,
  pageSize = 20,
  getAccount = requireAuthenticatedUser,
  db = prisma,
}: {
  status?: SchoolApplicationStatus;
  page?: number;
  pageSize?: number;
  getAccount?: () => Promise<AuthAccount>;
  db?: PlatformDb;
}) {
  const admin = await requireAdmin(getAccount);
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const where = status ? { status } : {};
  const [items, total] = await Promise.all([
    db.schoolApplication.findMany({
      where,
      select: applicationListSelect,
      orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    db.schoolApplication.count({ where }),
  ]);
  return { items, total, page: safePage, pageSize: safePageSize, adminUserId: admin.profile.id };
}

export async function getPlatformApplication(
  applicationId: string,
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser,
  db: PlatformDb = prisma
) {
  const admin = await requireAdmin(getAccount);
  const application = await db.schoolApplication.findUnique({ where: { id: applicationId }, select: applicationReviewSelect });
  if (!application) throw new NotFoundError('School application not found.');
  return { application, adminUserId: admin.profile.id };
}

export async function createPlatformApplicationDocumentDownloadUrl({
  applicationId,
  documentId,
  getAccount = requireAuthenticatedUser,
  db = prisma,
  storage,
}: {
  applicationId: string;
  documentId: string;
  getAccount?: () => Promise<AuthAccount>;
  db?: PlatformDb;
  storage?: Storage;
}) {
  await requireAdmin(getAccount);
  const document = await db.schoolApplicationDocument.findFirst({
    where: { id: documentId, applicationId },
    select: { storageKey: true },
  });
  if (!document) throw new NotFoundError('Application document not found.');
  return createAuthorizedPrivateDownloadUrl({
    storageKey: document.storageKey,
    allowedPrefix: `school-applications/${applicationId}`,
    authorize: async () => true,
    storage,
  });
}

async function reviewTransaction({
  applicationId,
  nextStatus,
  reviewNotes,
  rejectionReason,
  admin,
  db,
}: {
  applicationId: string;
  nextStatus: 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'REJECTED';
  reviewNotes?: string;
  rejectionReason?: string;
  admin: AuthAccount;
  db: PlatformDb;
}) {
  return db.$transaction(async tx => {
    const application = await tx.schoolApplication.findUnique({ where: { id: applicationId }, select: { id: true, status: true } });
    if (!application) throw new NotFoundError('School application not found.');
    assertReviewTransition(application.status, nextStatus);
    const updated = await tx.schoolApplication.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        reviewedAt: new Date(),
        reviewedByUserId: admin.profile.id,
        reviewNotes: nextStatus === 'CHANGES_REQUESTED' ? reviewNotes?.trim() || null : undefined,
        rejectionReason: nextStatus === 'REJECTED' ? rejectionReason?.trim() || null : undefined,
      },
      select: { id: true, status: true, reviewedAt: true },
    });
    await auditService.append({
      actorType: 'PLATFORM_ADMIN',
      actorUserId: admin.profile.id,
      action: `SCHOOL_APPLICATION_${nextStatus}`,
      entityType: 'SchoolApplication',
      entityId: applicationId,
      metadata: { status: nextStatus },
    }, tx as never);
    return updated;
  });
}

export async function markApplicationUnderReview(applicationId: string, getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser, db: PlatformDb = prisma) {
  const admin = await requireAdmin(getAccount);
  return reviewTransaction({ applicationId, nextStatus: 'UNDER_REVIEW', admin, db });
}

export async function requestApplicationChanges(applicationId: string, reviewNotes: string, getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser, db: PlatformDb = prisma) {
  const admin = await requireAdmin(getAccount);
  if (!reviewNotes.trim()) throw new BusinessRuleError('A change request must include review notes.');
  return reviewTransaction({ applicationId, nextStatus: 'CHANGES_REQUESTED', reviewNotes, admin, db });
}

export async function rejectApplication(applicationId: string, rejectionReason: string, getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser, db: PlatformDb = prisma) {
  const admin = await requireAdmin(getAccount);
  if (!rejectionReason.trim()) throw new BusinessRuleError('A rejection must include a reason.');
  return reviewTransaction({ applicationId, nextStatus: 'REJECTED', rejectionReason, admin, db });
}

function slugBase(name: string) {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56) || 'school';
}

async function uniqueSlug(tx: Prisma.TransactionClient, name: string, applicationId: string) {
  const suffix = applicationId.replace(/-/g, '').slice(0, 8);
  const base = `${slugBase(name)}-${suffix}`.slice(0, 80);
  let candidate = base;
  let counter = 2;
  while (await tx.school.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base.slice(0, 78 - String(counter).length)}-${counter++}`;
  }
  return candidate;
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function approveApplication(
  applicationId: string,
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser,
  db: PlatformDb = prisma
) {
  const admin = await requireAdmin(getAccount);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(async tx => {
        const application = await tx.schoolApplication.findUnique({
          where: { id: applicationId },
          select: {
            id: true, applicantUserId: true, schoolName: true, legalName: true, registrationNumber: true,
            email: true, phone: true, website: true, addressLine1: true, addressLine2: true, city: true,
            stateOrRegion: true, postalCode: true, countryCode: true, status: true,
          },
        });
        if (!application) throw new NotFoundError('School application not found.');
        if (application.status === 'APPROVED') {
          const existing = await tx.school.findUnique({ where: { sourceApplicationId: applicationId }, select: { id: true, slug: true } });
          if (existing) return { school: existing, idempotent: true };
          throw new ConflictError('Approved application is missing its provisioned school.');
        }
        assertReviewTransition(application.status, 'APPROVED');
        const school = await tx.school.create({
          data: {
            name: application.schoolName,
            legalName: application.legalName,
            registrationNumber: application.registrationNumber,
            slug: await uniqueSlug(tx, application.schoolName, application.id),
            email: application.email,
            phone: application.phone,
            website: application.website,
            addressLine1: application.addressLine1,
            addressLine2: application.addressLine2,
            city: application.city,
            stateOrRegion: application.stateOrRegion,
            postalCode: application.postalCode,
            countryCode: application.countryCode,
            timezone: 'UTC',
            currencyCode: 'USD',
            status: 'ACTIVE',
            approvedAt: new Date(),
            sourceApplicationId: application.id,
          },
          select: { id: true, slug: true },
        });
        await tx.schoolMembership.create({
          data: { schoolId: school.id, userId: application.applicantUserId, role: 'SCHOOL_OWNER', status: 'ACTIVE', joinedAt: new Date() },
          select: { id: true },
        });
        const reviewedAt = new Date();
        await tx.schoolApplication.update({
          where: { id: application.id },
          data: { status: 'APPROVED', reviewedAt, reviewedByUserId: admin.profile.id },
        });
        await tx.notificationOutbox.create({
          data: {
            eventKey: `SCHOOL_APPROVED:${application.id}`,
            type: 'SCHOOL_APPROVED_NOTIFICATION',
            applicationId: application.id,
            schoolId: school.id,
            payload: { applicationId: application.id, schoolId: school.id, applicantUserId: application.applicantUserId },
          },
        });
        await auditService.append({ actorType: 'PLATFORM_ADMIN', actorUserId: admin.profile.id, action: 'SCHOOL_APPLICATION_APPROVED', entityType: 'SchoolApplication', entityId: application.id }, tx as never);
        await auditService.append({ actorType: 'PLATFORM_ADMIN', actorUserId: admin.profile.id, action: 'SCHOOL_TENANT_PROVISIONED', entityType: 'School', entityId: school.id, schoolId: school.id, metadata: { sourceApplicationId: application.id } }, tx as never);
        return { school, idempotent: false };
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await db.school.findUnique({ where: { sourceApplicationId: applicationId }, select: { id: true, slug: true } });
      if (existing) return { school: existing, idempotent: true };
    }
  }
  throw new ConflictError('Application provisioning conflicted with another approval attempt.');
}

const schoolSelect = {
  id: true, name: true, legalName: true, slug: true, email: true, phone: true, website: true,
  addressLine1: true, addressLine2: true, city: true, stateOrRegion: true, postalCode: true,
  countryCode: true, timezone: true, currencyCode: true, status: true, approvedAt: true, createdAt: true,
  sourceApplicationId: true,
} satisfies Prisma.SchoolSelect;

export async function listPlatformSchools({ page = 1, pageSize = 20, getAccount = requireAuthenticatedUser, db = prisma }: { page?: number; pageSize?: number; getAccount?: () => Promise<AuthAccount>; db?: PlatformDb }) {
  await requireAdmin(getAccount);
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const [items, total] = await Promise.all([
    db.school.findMany({ select: schoolSelect, orderBy: { createdAt: 'desc' }, skip: (safePage - 1) * safePageSize, take: safePageSize }),
    db.school.count(),
  ]);
  return { items, total, page: safePage, pageSize: safePageSize };
}

export async function getPlatformSchool(schoolId: string, getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser, db: PlatformDb = prisma) {
  await requireAdmin(getAccount);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: schoolSelect });
  if (!school) throw new NotFoundError('School not found.');
  return school;
}

export async function setSchoolSuspended(schoolId: string, suspended: boolean, getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser, db: PlatformDb = prisma) {
  const admin = await requireAdmin(getAccount);
  return db.$transaction(async tx => {
    const school = await tx.school.findUnique({ where: { id: schoolId }, select: { id: true, status: true } });
    if (!school) throw new NotFoundError('School not found.');
    const next = suspended ? 'SUSPENDED' : 'ACTIVE';
    if (school.status === next) return school;
    if (!['ACTIVE', 'SUSPENDED'].includes(school.status)) throw new BusinessRuleError('Archived schools cannot be changed here.');
    const updated = await tx.school.update({ where: { id: schoolId }, data: { status: next }, select: { id: true, status: true } });
    await auditService.append({ actorType: 'PLATFORM_ADMIN', actorUserId: admin.profile.id, action: suspended ? 'SCHOOL_SUSPENDED' : 'SCHOOL_REACTIVATED', entityType: 'School', entityId: schoolId, schoolId }, tx as never);
    return updated;
  });
}
