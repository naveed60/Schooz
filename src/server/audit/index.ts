import 'server-only';

import { prisma } from '@schooz/database';
import type { SchoolContext } from '@/server/authorization';
import type { AuditActorType, Prisma } from '@prisma/client';

const PRIVATE_KEY = /(password|secret|token|authorization|cookie|service.?role|api.?key|private.?key|content|fileData)/i;

function safeAuditValue(value: unknown, depth = 0): Prisma.InputJsonValue | undefined {
  if (depth > 4) return '[truncated]';
  if (value === null) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map(item => safeAuditValue(item, depth + 1) ?? null) as Prisma.InputJsonValue;
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).slice(0, 50).map(([key, item]) => [
        key,
        PRIVATE_KEY.test(key) ? '[redacted]' : safeAuditValue(item, depth + 1) ?? null,
      ])
    ) as Prisma.InputJsonValue;
  }
  return undefined;
}

export type AuditEvent = {
  schoolId?: string | null;
  actorUserId?: string | null;
  actorType: AuditActorType;
  action: string;
  entityType: string;
  entityId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
  previousValues?: unknown;
  newValues?: unknown;
};

export class AuditService {
  async append(event: AuditEvent, db = prisma) {
    return db.auditLog.create({
      data: {
        schoolId: event.schoolId ?? null,
        actorUserId: event.actorUserId ?? null,
        actorType: event.actorType,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        requestId: event.requestId ?? null,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent?.slice(0, 512) ?? null,
        metadata: safeAuditValue(event.metadata),
        previousValues: safeAuditValue(event.previousValues),
        newValues: safeAuditValue(event.newValues),
      },
    });
  }

  async appendForSchool(
    context: Pick<SchoolContext, 'schoolId' | 'userId'>,
    event: Omit<AuditEvent, 'schoolId' | 'actorUserId'>,
    db = prisma
  ) {
    return this.append({ ...event, schoolId: context.schoolId, actorUserId: context.userId, actorType: event.actorType ?? 'USER' }, db);
  }
}

export const auditService = new AuditService();
