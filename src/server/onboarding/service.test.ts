import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

import { createApplicationDraft, createMyDocumentDownloadUrl, getMyApplication, updateApplicationDraft } from './service';

const account = (id: string) => () => Promise.resolve({ profile: { id } } as never);

describe('school application ownership', () => {
  it('does not allow another applicant to read, update or download an application document', async () => {
    const db = {
      schoolApplication: {
        findFirst: async ({ where }: { where: { applicantUserId: string } }) => where.applicantUserId === 'user-a' ? { id: 'application-a', status: 'DRAFT' } : null,
        update: async () => ({ id: 'application-a' }),
        create: async ({ data }: { data: Record<string, unknown> }) => data,
      },
      schoolApplicationDocument: {
        findFirst: async () => null,
        create: async () => ({ id: 'document-a' }),
      },
    } as never;

    await expect(getMyApplication('application-a', account('user-b'), db)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(updateApplicationDraft('application-a', { schoolName: 'North Star School', schoolType: 'PRIVATE', email: 'a@example.com', phone: '+923001234567', addressLine1: 'Main', city: 'Lahore', stateOrRegion: 'Punjab', countryCode: 'PK' }, account('user-b'), db)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(createMyDocumentDownloadUrl({ applicationId: 'application-a', documentId: 'document-a', getAccount: account('user-b'), db })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('ignores forged review and approval fields on draft creation', async () => {
    let captured: Record<string, unknown> | undefined;
    const db = {
      schoolApplication: {
        create: async ({ data }: { data: Record<string, unknown> }) => { captured = data; return data; },
      },
    } as never;
    await createApplicationDraft({ schoolName: 'North Star School', schoolType: 'PRIVATE', email: 'a@example.com', phone: '+923001234567', addressLine1: 'Main', city: 'Lahore', stateOrRegion: 'Punjab', countryCode: 'PK', status: 'APPROVED', reviewedByUserId: 'other-user', reviewNotes: 'forged' }, account('user-a'), db);
    expect(captured).not.toHaveProperty('status');
    expect(captured).not.toHaveProperty('reviewedByUserId');
    expect(captured).not.toHaveProperty('reviewNotes');
    expect(captured?.applicantUserId).toBe('user-a');
  });
});
