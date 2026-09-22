import 'server-only';

import { prisma } from '@schooz/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSchoolContextCached, requireSchoolPermission, type SchoolContext } from '../authorization';
import { auditService } from '../audit';
import { ValidationError } from '../errors';
import { createAuthorizedDownloadUrl, uploadPrivateObject } from '../storage';
import { schoolLogoMetadataSchema, schoolSettingsSchema, type SchoolSettingsInput } from './schemas';

type SettingsDb = Pick<typeof prisma, 'school'>;
const settingsSelect = {
  id: true, name: true, slug: true, legalName: true, registrationNumber: true, email: true, phone: true,
  website: true, logoStorageKey: true, addressLine1: true, addressLine2: true, city: true, stateOrRegion: true,
  postalCode: true, countryCode: true, timezone: true, currencyCode: true, dateFormat: true,
  studentNumberPrefix: true, invoiceNumberPrefix: true, status: true,
} as const;

export async function getSchoolSettings(context: SchoolContext, db: SettingsDb = prisma) {
  requireSchoolPermission(context, 'school/settings:read');
  const school = await db.school.findUnique({ where: { id: context.schoolId }, select: settingsSelect });
  if (!school) throw new ValidationError('School settings are unavailable.');
  return school;
}

export async function updateSchoolSettings(context: SchoolContext, input: unknown, db: SettingsDb = prisma) {
  requireSchoolPermission(context, 'school/settings:update');
  const parsed = schoolSettingsSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError('Invalid school settings.');
  const current = await getSchoolSettings(context, db);
  const data: SchoolSettingsInput = parsed.data;
  const changed = Object.keys(data).some(key => current[key as keyof typeof data] !== data[key as keyof typeof data]);
  if (!changed) return current;
  const updated = await db.school.update({ where: { id: context.schoolId }, data: {
    timezone: data.timezone,
    currencyCode: data.currencyCode,
    dateFormat: data.dateFormat,
    studentNumberPrefix: data.studentNumberPrefix,
    invoiceNumberPrefix: data.invoiceNumberPrefix,
  }, select: settingsSelect });
  await auditService.append({
    schoolId: context.schoolId,
    actorUserId: context.userId,
    actorType: 'USER',
    action: 'SCHOOL_SETTINGS_UPDATED',
    entityType: 'School',
    entityId: context.schoolId,
    previousValues: { timezone: current.timezone, currencyCode: current.currencyCode, dateFormat: current.dateFormat, studentNumberPrefix: current.studentNumberPrefix, invoiceNumberPrefix: current.invoiceNumberPrefix },
    newValues: { timezone: updated.timezone, currencyCode: updated.currencyCode, dateFormat: updated.dateFormat, studentNumberPrefix: updated.studentNumberPrefix, invoiceNumberPrefix: updated.invoiceNumberPrefix },
  });
  return updated;
}

export async function uploadSchoolLogo({ context, file, metadata, db = prisma, upload = uploadPrivateObject }: { context: SchoolContext; file: Blob | ArrayBuffer | Uint8Array; metadata: unknown; db?: SettingsDb; upload?: typeof uploadPrivateObject }) {
  requireSchoolPermission(context, 'school/settings:update');
  const parsed = schoolLogoMetadataSchema.safeParse(metadata);
  if (!parsed.success) throw new ValidationError('Invalid school logo.');
  const uploaded = await upload({ context, file, metadata: { contentType: parsed.data.contentType, sizeBytes: parsed.data.sizeBytes, originalName: parsed.data.originalName } });
  const updated = await db.school.update({ where: { id: context.schoolId }, data: { logoStorageKey: uploaded.storageKey }, select: { logoStorageKey: true } });
  await auditService.append({ actorType: 'USER', actorUserId: context.userId, schoolId: context.schoolId, action: 'SCHOOL_SETTINGS_UPDATED', entityType: 'School', entityId: context.schoolId, metadata: { changed: ['logoStorageKey'] } });
  return updated;
}

export async function getSchoolLogoUrl(context: SchoolContext, storage?: { client: SupabaseClient; bucket: string }, db: SettingsDb = prisma) {
  requireSchoolPermission(context, 'school/settings:read');
  const school = await db.school.findUnique({ where: { id: context.schoolId }, select: { logoStorageKey: true } });
  if (!school?.logoStorageKey) return null;
  return createAuthorizedDownloadUrl({ context, schoolId: context.schoolId, storageKey: school.logoStorageKey, storage });
}

export async function contextForSchoolSlug(schoolSlug: string) {
  return resolveSchoolContextCached(schoolSlug);
}
