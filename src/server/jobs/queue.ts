import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { jobEnvelopeSchema, type JobEnvelope } from './envelope';
import { parseServerEnv } from '../env-schema';

type QueueRpcClient = SupabaseClient;

function queueConfig() {
  const env = parseServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('QUEUE_NOT_CONFIGURED');
  }
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.SUPABASE_SERVICE_ROLE_KEY, queueName: env.SUPABASE_QUEUE_NAME };
}

export function createQueueClient(): QueueRpcClient {
  const config = queueConfig();
  return createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function enqueueJob(
  envelope: JobEnvelope,
  client = createQueueClient()
) {
  const config = queueConfig();
  const message = jobEnvelopeSchema.parse(envelope);
  const { data, error } = await client.schema('pgmq').rpc('send', {
    queue_name: config.queueName,
    message,
  });
  if (error) throw new Error('QUEUE_ENQUEUE_FAILED');
  return data;
}

export type QueueMessage = {
  msg_id: number;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: unknown;
};

export async function readJobs(
  visibilityTimeoutSeconds: number,
  quantity: number,
  client = createQueueClient()
): Promise<QueueMessage[]> {
  const config = queueConfig();
  const { data, error } = await client.schema('pgmq').rpc('read', {
    queue_name: config.queueName,
    vt: visibilityTimeoutSeconds,
    qty: quantity,
  });
  if (error) throw new Error('QUEUE_READ_FAILED');
  return (Array.isArray(data) ? data : []) as QueueMessage[];
}

export async function acknowledgeJob(msgId: number, client = createQueueClient()) {
  const config = queueConfig();
  const { error } = await client.schema('pgmq').rpc('delete', {
    queue_name: config.queueName,
    msg_id: msgId,
  });
  if (error) throw new Error('QUEUE_ACK_FAILED');
}
