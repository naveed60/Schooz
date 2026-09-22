import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const jobEnvelopeSchema = z.object({
  jobId: z.string().uuid(),
  type: z.string().min(1).max(120),
  version: z.number().int().positive(),
  schoolId: z.string().uuid().nullable(),
  actorUserId: z.string().uuid().nullable(),
  entityId: z.string().max(160).nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type JobEnvelope = z.infer<typeof jobEnvelopeSchema>;

export function createJobEnvelope(input: Omit<JobEnvelope, 'jobId' | 'version'> & { version?: number }): JobEnvelope {
  return jobEnvelopeSchema.parse({ ...input, jobId: randomUUID(), version: input.version ?? 1 });
}
