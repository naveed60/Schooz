import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { SchoolContext } from '../authorization';
import { requireSchoolMembership } from '../authorization';
import { AuthorizationError, ValidationError } from '../errors';
import { parseServerEnv } from '../env-schema';

const uploadMetadataSchema = z.object({
  contentType: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
  originalName: z.string().trim().min(1).max(180).refine(name => !/[\\/\0]/.test(name), 'Invalid file name'),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

function storageConfig() {
  const env = parseServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('PRIVATE_STORAGE_NOT_CONFIGURED');
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: env.SUPABASE_PRIVATE_STORAGE_BUCKET,
  };
}

export function createPrivateStorageClient(): SupabaseClient {
  const config = storageConfig();
  return createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function validateUploadMetadata(input: unknown): UploadMetadata {
  const parsed = uploadMetadataSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError('Invalid or unsupported upload metadata.');
  return parsed.data;
}

export function generateStorageKey(
  context: SchoolContext,
  metadata: UploadMetadata,
  objectId: string = randomUUID()
) {
  requireSchoolMembership(context);
  const extension = metadata.originalName.includes('.')
    ? metadata.originalName.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'bin';
  return `schools/${context.schoolId}/objects/${objectId}.${extension || 'bin'}`;
}

function assertTenantStorageAccess(context: SchoolContext, schoolId: string, storageKey: string) {
  requireSchoolMembership(context);
  if (context.schoolId !== schoolId || !storageKey.startsWith(`schools/${schoolId}/`)) {
    throw new AuthorizationError();
  }
}

function assertPrivateKeyPrefix(storageKey: string, allowedPrefix: string) {
  if (!allowedPrefix || !storageKey.startsWith(`${allowedPrefix.replace(/\/$/, '')}/`)) {
    throw new AuthorizationError();
  }
}

export function generateApplicationStorageKey(
  applicationId: string,
  metadata: UploadMetadata,
  objectId = randomUUID()
) {
  const extension = metadata.originalName.includes('.')
    ? metadata.originalName.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'bin';
  return `school-applications/${applicationId}/${objectId}.${extension || 'bin'}`;
}

export async function uploadPrivateObjectAtKey({
  storageKey,
  allowedPrefix,
  file,
  metadata,
}: {
  storageKey: string;
  allowedPrefix: string;
  file: Blob | ArrayBuffer | Uint8Array;
  metadata: UploadMetadata;
}) {
  assertPrivateKeyPrefix(storageKey, allowedPrefix);
  const validMetadata = validateUploadMetadata(metadata);
  const config = storageConfig();
  const { error } = await createPrivateStorageClient()
    .storage.from(config.bucket)
    .upload(storageKey, file, { contentType: validMetadata.contentType, upsert: false });
  if (error) throw new Error('PRIVATE_STORAGE_UPLOAD_FAILED');
  return { storageKey, metadata: validMetadata };
}

export async function uploadPrivateObject({
  context,
  file,
  metadata,
}: {
  context: SchoolContext;
  file: Blob | ArrayBuffer | Uint8Array;
  metadata: UploadMetadata;
}) {
  const validMetadata = validateUploadMetadata(metadata);
  const storageKey = generateStorageKey(context, validMetadata);
  const config = storageConfig();
  const { error } = await createPrivateStorageClient()
    .storage.from(config.bucket)
    .upload(storageKey, file, {
      contentType: validMetadata.contentType,
      upsert: false,
    });
  if (error) throw new Error('PRIVATE_STORAGE_UPLOAD_FAILED');
  return { storageKey, metadata: validMetadata };
}

export async function createAuthorizedDownloadUrl({
  context,
  schoolId,
  storageKey,
  expiresInSeconds = 300,
  storage,
}: {
  context: SchoolContext;
  schoolId: string;
  storageKey: string;
  expiresInSeconds?: number;
  storage?: { client: SupabaseClient; bucket: string };
}) {
  assertTenantStorageAccess(context, schoolId, storageKey);
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 900) {
    throw new ValidationError('Signed URL expiration must be between 1 and 900 seconds.');
  }
  const config = storage ?? storageConfig();
  const { data, error } = await (storage?.client ?? createPrivateStorageClient())
    .storage.from(config.bucket)
    .createSignedUrl(storageKey, expiresInSeconds);
  if (error || !data?.signedUrl) throw new Error('PRIVATE_STORAGE_SIGNED_URL_FAILED');
  return data.signedUrl;
}

export async function createAuthorizedPrivateDownloadUrl({
  storageKey,
  allowedPrefix,
  authorize,
  expiresInSeconds = 300,
  storage,
}: {
  storageKey: string;
  allowedPrefix: string;
  authorize: () => Promise<boolean>;
  expiresInSeconds?: number;
  storage?: { client: SupabaseClient; bucket: string };
}) {
  assertPrivateKeyPrefix(storageKey, allowedPrefix);
  if (!(await authorize())) throw new AuthorizationError();
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 900) {
    throw new ValidationError('Signed URL expiration must be between 1 and 900 seconds.');
  }
  const config = storage ?? storageConfig();
  const { data, error } = await (storage?.client ?? createPrivateStorageClient())
    .storage.from(config.bucket)
    .createSignedUrl(storageKey, expiresInSeconds);
  if (error || !data?.signedUrl) throw new Error('PRIVATE_STORAGE_SIGNED_URL_FAILED');
  return data.signedUrl;
}

export async function deletePrivateObjectAtKey({ storageKey, allowedPrefix }: { storageKey: string; allowedPrefix: string }) {
  assertPrivateKeyPrefix(storageKey, allowedPrefix);
  const config = storageConfig();
  const { error } = await createPrivateStorageClient().storage.from(config.bucket).remove([storageKey]);
  if (error) throw new Error('PRIVATE_STORAGE_DELETE_FAILED');
}
