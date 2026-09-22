import { prisma } from '@schooz/database';
import { createJobEnvelope } from './envelope';
import { enqueueJob } from './queue';

type OutboxDb = Pick<typeof prisma, 'notificationOutbox'>;

export async function dispatchPendingOutbox(limit = 20, db: OutboxDb = prisma, send = enqueueJob) {
  const now = new Date();
  const pending = await db.notificationOutbox.findMany({
    where: { status: 'QUEUED', availableAt: { lte: now } },
    orderBy: { createdAt: 'asc' },
    take: Math.min(100, Math.max(1, limit)),
  });
  let dispatched = 0;
  for (const event of pending) {
    const claimed = await db.notificationOutbox.updateMany({
      where: { id: event.id, status: 'QUEUED' },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;
    try {
      await send(createJobEnvelope({
        type: event.type,
        schoolId: event.schoolId,
        actorUserId: null,
        entityId: event.applicationId,
        metadata: { idempotencyKey: event.eventKey, payload: event.payload },
      }));
      await db.notificationOutbox.update({ where: { id: event.id }, data: { status: 'SENT', processedAt: new Date() } });
      dispatched += 1;
    } catch {
      const terminal = event.attempts + 1 >= 3;
      await db.notificationOutbox.update({
        where: { id: event.id },
        data: {
          status: terminal ? 'FAILED' : 'QUEUED',
          ...(terminal ? { processedAt: new Date() } : { availableAt: new Date(Date.now() + (event.attempts + 1) * 30_000) }),
        },
      });
    }
  }
  return dispatched;
}
