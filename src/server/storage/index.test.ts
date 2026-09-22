import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createAuthorizedDownloadUrl, generateStorageKey, validateUploadMetadata } from './index';

const context = {
  schoolId: 'school-a',
  schoolSlug: 'school-a',
  userId: 'user-a',
  membershipId: 'membership-a',
  role: 'SCHOOL_OWNER' as const,
  permissions: [],
};

describe('private storage conventions', () => {
  it('validates metadata and generates tenant-owned keys', () => {
    const metadata = validateUploadMetadata({ contentType: 'application/pdf', sizeBytes: 100, originalName: 'report.pdf' });
    expect(generateStorageKey(context, metadata, 'object-1')).toBe('schools/school-a/objects/object-1.pdf');
  });

  it('rejects unsafe or unsupported uploads', () => {
    expect(() => validateUploadMetadata({ contentType: 'application/x-sh', sizeBytes: 10, originalName: '../secret' })).toThrow('Invalid or unsupported upload metadata.');
  });

  it('creates a short-lived URL for an authorized tenant object and rejects another tenant', async () => {
    const fakeClient = {
      storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: 'https://signed.test/object' }, error: null }) }) },
    } as never;
    await expect(createAuthorizedDownloadUrl({
      context,
      schoolId: 'school-a',
      storageKey: 'schools/school-a/objects/object-1.pdf',
      storage: { client: fakeClient, bucket: 'private-files' },
    })).resolves.toBe('https://signed.test/object');
    await expect(createAuthorizedDownloadUrl({
      context,
      schoolId: 'school-b',
      storageKey: 'schools/school-b/objects/object-1.pdf',
      storage: { client: fakeClient, bucket: 'private-files' },
    })).rejects.toMatchObject({ code: 'AUTHORIZATION_ERROR' });
  });
});
