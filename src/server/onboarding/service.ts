import 'server-only';

import { prisma } from '@schooz/database';
import type { Prisma } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '../auth/profile';
import { auditService } from '../audit';
import { BusinessRuleError, NotFoundError, ValidationError } from '../errors';
import {
  createAuthorizedPrivateDownloadUrl,
  generateApplicationStorageKey,
  uploadPrivateObjectAtKey,
} from '../storage';
import { assertApplicantCanEdit, assertApplicantCanSubmit } from './state';
import {
  applicationDocumentSchema,
  type ApplicationDocumentInput,
  schoolApplicationSchema,
  type SchoolApplicationInput,
} from './schemas';

type AuthAccount = Awaited<ReturnType<typeof requireAuthenticatedUser>>;
type ApplicationDb = Pick<typeof prisma, 'schoolApplication' | 'schoolApplicationDocument'>;

const applicationListSelect = {
  id: true,
  schoolName: true,
  schoolType: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewNotes: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  documents: {
    select: {
      id: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      documentType: true,
      uploadedAt: true,
    },
    orderBy: { uploadedAt: 'desc' as const },
  },
} satisfies Prisma.SchoolApplicationSelect;

const applicationDetailSelect = {
  ...applicationListSelect,
  legalName: true,
  registrationNumber: true,
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
} satisfies Prisma.SchoolApplicationSelect;

async function accountId(getAccount: () => Promise<AuthAccount>) {
  return (await getAccount()).profile.id;
}

function parseApplicationInput(input: unknown): SchoolApplicationInput {
  const result = schoolApplicationSchema.safeParse(input);
  if (!result.success) throw new ValidationError('Invalid school application details.');
  return result.data;
}

function parseDocumentInput(input: unknown): ApplicationDocumentInput {
  const result = applicationDocumentSchema.safeParse(input);
  if (!result.success) throw new ValidationError('Invalid verification document metadata.');
  return result.data;
}

export async function listMyApplications(
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser,
  db: ApplicationDb = prisma
) {
  const applicantUserId = await accountId(getAccount);
  return db.schoolApplication.findMany({
    where: { applicantUserId },
    select: applicationListSelect,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMyApplication(
  applicationId: string,
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser,
  db: ApplicationDb = prisma
) {
  const applicantUserId = await accountId(getAccount);
  const application = await db.schoolApplication.findFirst({
    where: { id: applicationId, applicantUserId },
    select: applicationDetailSelect,
  });
  if (!application) throw new NotFoundError('School application not found.');
  return application;
}

export async function createApplicationDraft(
  input: unknown,
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser,
  db: ApplicationDb = prisma
) {
  const data = parseApplicationInput(input);
  const applicantUserId = await accountId(getAccount);
  return db.schoolApplication.create({
    data: { ...data, applicantUserId },
    select: applicationListSelect,
  });
}

export async function updateApplicationDraft(
  applicationId: string,
  input: unknown,
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser,
  db: ApplicationDb = prisma
) {
  const data = parseApplicationInput(input);
  const applicantUserId = await accountId(getAccount);
  const current = await db.schoolApplication.findFirst({
    where: { id: applicationId, applicantUserId },
    select: { id: true, status: true },
  });
  if (!current) throw new NotFoundError('School application not found.');
  assertApplicantCanEdit(current.status);
  return db.schoolApplication.update({
    where: { id: current.id },
    data,
    select: applicationListSelect,
  });
}

export async function submitApplication(
  applicationId: string,
  getAccount: () => Promise<AuthAccount> = requireAuthenticatedUser,
  db: ApplicationDb = prisma,
  appendAudit = auditService.append
) {
  const account = await getAccount();
  const current = await db.schoolApplication.findFirst({
    where: { id: applicationId, applicantUserId: account.profile.id },
    select: { id: true, status: true, schoolName: true },
  });
  if (!current) throw new NotFoundError('School application not found.');
  assertApplicantCanSubmit(current.status);
  const documentCount = await db.schoolApplicationDocument.count({ where: { applicationId } });
  if (documentCount < 1) throw new BusinessRuleError('Upload at least one verification document before submitting.');

  const submittedAt = new Date();
  const updated = await db.schoolApplication.updateMany({
    where: {
      id: applicationId,
      applicantUserId: account.profile.id,
      status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
    },
    data: { status: 'SUBMITTED', submittedAt },
  });
  if (updated.count !== 1) throw new ValidationError('The application changed before submission.');
  await appendAudit({
    actorType: 'USER',
    actorUserId: account.profile.id,
    action: 'SCHOOL_APPLICATION_SUBMITTED',
    entityType: 'SchoolApplication',
    entityId: applicationId,
    metadata: { schoolName: current.schoolName },
  });
  return { id: applicationId, status: 'SUBMITTED' as const, submittedAt };
}

export async function uploadApplicationDocument({
  applicationId,
  file,
  metadata,
  getAccount = requireAuthenticatedUser,
  db = prisma,
  upload = uploadPrivateObjectAtKey,
}: {
  applicationId: string;
  file: Blob | ArrayBuffer | Uint8Array;
  metadata: unknown;
  getAccount?: () => Promise<AuthAccount>;
  db?: ApplicationDb;
  upload?: typeof uploadPrivateObjectAtKey;
}) {
  const account = await getAccount();
  const validMetadata = parseDocumentInput(metadata);
  const application = await db.schoolApplication.findFirst({
    where: { id: applicationId, applicantUserId: account.profile.id },
    select: { id: true, status: true },
  });
  if (!application) throw new NotFoundError('School application not found.');
  assertApplicantCanEdit(application.status);

  const storageKey = generateApplicationStorageKey(applicationId, {
    contentType: validMetadata.mimeType,
    sizeBytes: validMetadata.sizeBytes,
    originalName: validMetadata.originalFileName,
  });
  await upload({
    storageKey,
    allowedPrefix: `school-applications/${applicationId}`,
    file,
    metadata: {
      contentType: validMetadata.mimeType,
      sizeBytes: validMetadata.sizeBytes,
      originalName: validMetadata.originalFileName,
    },
  });
  return db.schoolApplicationDocument.create({
    data: {
      applicationId,
      storageKey,
      originalFileName: validMetadata.originalFileName,
      mimeType: validMetadata.mimeType,
      sizeBytes: validMetadata.sizeBytes,
      documentType: validMetadata.documentType,
    },
    select: { id: true, originalFileName: true, documentType: true, uploadedAt: true },
  });
}

export async function createMyDocumentDownloadUrl({
  applicationId,
  documentId,
  getAccount = requireAuthenticatedUser,
  db = prisma,
  storage,
}: {
  applicationId: string;
  documentId: string;
  getAccount?: () => Promise<AuthAccount>;
  db?: ApplicationDb;
  storage?: { client: SupabaseClient; bucket: string };
}) {
  const applicantUserId = await accountId(getAccount);
  const document = await db.schoolApplicationDocument.findFirst({
    where: {
      id: documentId,
      applicationId,
      application: { applicantUserId },
    },
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
