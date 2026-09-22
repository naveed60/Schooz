# Background jobs and worker

Application jobs use Supabase Queues/pgmq for durable delivery. The queue name
defaults to `schooz_jobs` and can be configured with `SUPABASE_QUEUE_NAME`.
Create that queue in Supabase Queues before starting the worker. The worker uses
the service-role client only; browser and Next.js client code never receives it.

Messages use a versioned envelope:

```json
{
  "jobId": "uuid",
  "type": "TEST_NOOP",
  "version": 1,
  "schoolId": "uuid-or-null",
  "actorUserId": "uuid-or-null",
  "entityId": "id-or-null",
  "metadata": { "idempotencyKey": "stable-key" }
}
```

`BackgroundJob` is the user-facing status and idempotency record. The worker
re-fetches application state by ID in feature handlers; envelope fields are
routing references, not authorization proof. Duplicate delivery claims the
same idempotency key only once. Failures are retried up to three deliveries;
the fourth delivery is acknowledged as a poison message and marked `FAILED`.

Run the independent worker with `pnpm --filter @schooz/worker start`. The
polling loop only reads, dispatches, and acknowledges messages; feature logic
belongs in handlers, not in the polling loop. Shutdown waits for the current
poll to finish and stops new polls.
