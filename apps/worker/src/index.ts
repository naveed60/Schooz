import { prisma } from '@schooz/database';
import {
  acknowledgeJob,
  readJobs,
  type QueueMessage,
} from '../../../src/server/jobs/queue';
import { jobEnvelopeSchema, type JobEnvelope } from '../../../src/server/jobs/envelope';
import {
  MAX_JOB_ATTEMPTS,
  processJob,
  type IdempotencyStore,
} from '../../../src/server/jobs/processor';
import { createLogger } from '../../../src/server/observability/logger';
import { getRequestId } from '../../../src/server/observability/request';
import { dispatchPendingOutbox } from '../../../src/server/jobs/outbox';

const logger = createLogger(getRequestId());
const POLL_INTERVAL_MS = 1000;
const VISIBILITY_TIMEOUT_SECONDS = 60;
let stopping = false;

const store: IdempotencyStore = {
  async claim(key) {
    const existing = await prisma.backgroundJob.findUnique({ where: { idempotencyKey: key } });
    if (!existing) {
      try {
        await prisma.backgroundJob.create({ data: { type: 'TEST_NOOP', idempotencyKey: key, status: 'RUNNING', attempts: 1, startedAt: new Date() } });
        return true;
      } catch {
        return false;
      }
    }
    if (existing.status === 'SUCCEEDED' || existing.status === 'FAILED' || existing.attempts >= MAX_JOB_ATTEMPTS) return false;
    const result = await prisma.backgroundJob.updateMany({
      where: { id: existing.id, status: { in: ['QUEUED', 'RUNNING'] }, attempts: { lt: MAX_JOB_ATTEMPTS } },
      data: { status: 'RUNNING', attempts: { increment: 1 }, startedAt: new Date() },
    });
    return result.count === 1;
  },
  async succeed(key) {
    await prisma.backgroundJob.updateMany({ where: { idempotencyKey: key }, data: { status: 'SUCCEEDED', completedAt: new Date() } });
  },
  async fail(key, errorCode, terminal) {
    await prisma.backgroundJob.updateMany({ where: { idempotencyKey: key }, data: { status: terminal ? 'FAILED' : 'QUEUED', errorCode: terminal ? errorCode : null, ...(terminal ? { completedAt: new Date() } : {}) } });
  },
};

async function dispatch(job: JobEnvelope) {
  switch (job.type) {
    case 'TEST_NOOP':
      return;
    case 'SCHOOL_APPROVED_NOTIFICATION':
      // Email/provider delivery is intentionally deferred; the durable outbox
      // event has still been dispatched and acknowledged exactly once.
      return;
    default:
      throw new Error(`UNSUPPORTED_JOB_TYPE:${job.type}`);
  }
}

async function handleMessage(message: QueueMessage) {
  const parsed = jobEnvelopeSchema.safeParse(message.message);
  if (!parsed.success) {
    logger.error('worker_invalid_job_envelope', { msgId: message.msg_id });
    await acknowledgeJob(message.msg_id);
    return;
  }
  const result = await processJob({
    job: parsed.data,
    deliveryCount: message.read_ct,
    store,
    handler: dispatch,
  });
  if (result.acknowledged) await acknowledgeJob(message.msg_id);
  logger.info('worker_job_processed', { type: parsed.data.type, msgId: message.msg_id, duplicate: result.duplicate, readCount: message.read_ct });
}

export async function runWorker() {
  while (!stopping) {
    try {
      await dispatchPendingOutbox(10);
      const messages = await readJobs(VISIBILITY_TIMEOUT_SECONDS, 10);
      for (const message of messages) await handleMessage(message);
    } catch (error) {
      logger.error('worker_poll_failed', { error: error instanceof Error ? error.name : 'unknown' });
    }
    if (!stopping) await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

function shutdown(signal: string) {
  stopping = true;
  logger.info('worker_shutdown_requested', { signal });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

if (process.argv[1]?.endsWith('/src/index.ts')) {
  runWorker().finally(() => prisma.$disconnect());
}
