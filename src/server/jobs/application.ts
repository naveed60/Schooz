import { prisma } from '@schooz/database';
import type { SchoolContext } from '@/server/authorization';
import { createJobEnvelope } from './envelope';
import { enqueueJob } from './queue';

export async function enqueueApplicationJob({
  type,
  idempotencyKey,
  context,
  entityType,
  entityId,
  metadata = {},
}: {
  type: string;
  idempotencyKey: string;
  context?: Pick<SchoolContext, 'schoolId' | 'userId'>;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const existing = await prisma.backgroundJob.findUnique({ where: { idempotencyKey } });
  if (existing) return existing;

  const job = await prisma.backgroundJob.create({
    data: {
      type,
      idempotencyKey,
      schoolId: context?.schoolId,
      createdByUserId: context?.userId,
      entityType,
      entityId,
    },
  });
  try {
    await enqueueJob(createJobEnvelope({
      type,
      version: 1,
      schoolId: context?.schoolId ?? null,
      actorUserId: context?.userId ?? null,
      entityId: entityId ?? null,
      metadata: { ...metadata, idempotencyKey },
    }));
  } catch (error) {
    await prisma.backgroundJob.update({ where: { id: job.id }, data: { status: 'FAILED', errorCode: 'QUEUE_ENQUEUE_FAILED', completedAt: new Date() } });
    throw error;
  }
  return job;
}
