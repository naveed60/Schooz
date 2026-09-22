import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { AuditService } from './index';

describe('AuditService', () => {
  it('writes actor and tenant context while redacting confidential values', async () => {
    let captured: Record<string, unknown> | undefined;
    const db = { auditLog: { create: async ({ data }: { data: Record<string, unknown> }) => { captured = data; return data; } } } as never;
    await new AuditService().appendForSchool(
      { schoolId: 'school-a', userId: 'user-a' },
      { actorType: 'USER', action: 'FILE_CREATED', entityType: 'FileObject', entityId: 'file-a', metadata: { filename: 'a.pdf', token: 'secret' } },
      db
    );
    expect(captured).toMatchObject({ schoolId: 'school-a', actorUserId: 'user-a', entityId: 'file-a' });
    expect(captured?.metadata).toEqual({ filename: 'a.pdf', token: '[redacted]' });
  });
});
