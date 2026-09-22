import type { JobEnvelope } from './envelope';

export const MAX_JOB_ATTEMPTS = 3;

export interface IdempotencyStore {
  claim(key: string): Promise<boolean>;
  succeed(key: string): Promise<void>;
  fail(key: string, errorCode: string, terminal: boolean): Promise<void>;
}

export type JobHandler = (job: JobEnvelope) => Promise<void>;

export async function processJob({
  job,
  deliveryCount,
  store,
  handler,
}: {
  job: JobEnvelope;
  deliveryCount: number;
  store: IdempotencyStore;
  handler: JobHandler;
}) {
  const claimed = await store.claim(job.metadata.idempotencyKey as string ?? job.jobId);
  if (!claimed) return { acknowledged: true, duplicate: true };
  try {
    await handler(job);
    await store.succeed(job.metadata.idempotencyKey as string ?? job.jobId);
    return { acknowledged: true, duplicate: false };
  } catch {
    const terminal = deliveryCount >= MAX_JOB_ATTEMPTS;
    await store.fail(job.metadata.idempotencyKey as string ?? job.jobId, 'JOB_HANDLER_FAILED', terminal);
    return { acknowledged: terminal, duplicate: false };
  }
}
