import { describe, expect, it } from 'vitest';
import { createJobEnvelope } from './envelope';
import { processJob } from './processor';

function store() {
  const claimed = new Set<string>();
  return {
    claimed,
    claim: async (key: string) => !claimed.has(key) && (claimed.add(key), true),
    succeed: async () => undefined,
    fail: async () => undefined,
  };
}

describe('job envelope processing', () => {
  it('does not repeat a duplicate delivery', async () => {
    const idempotency = store();
    const job = createJobEnvelope({ type: 'TEST_NOOP', schoolId: null, actorUserId: null, entityId: null, metadata: { idempotencyKey: 'same-job' } });
    let count = 0;
    await processJob({ job, deliveryCount: 1, store: idempotency, handler: async () => { count += 1; } });
    const duplicate = await processJob({ job, deliveryCount: 1, store: idempotency, handler: async () => { count += 1; } });
    expect(count).toBe(1);
    expect(duplicate).toMatchObject({ acknowledged: true, duplicate: true });
  });

  it('acknowledges a poison job after bounded retries', async () => {
    const idempotency = store();
    const job = createJobEnvelope({ type: 'TEST_NOOP', schoolId: null, actorUserId: null, entityId: null, metadata: { idempotencyKey: 'bad-job' } });
    const result = await processJob({ job, deliveryCount: 3, store: idempotency, handler: async () => { throw new Error('fail'); } });
    expect(result.acknowledged).toBe(true);
  });
});
