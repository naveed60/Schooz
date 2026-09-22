# Platform review and tenant provisioning

Only `PLATFORM_ADMIN` accounts can access `/platform/applications/*` and
`/platform/schools/*` or invoke their server actions. Approval never trusts a
client slug or school ID. The service re-reads the application and derives the
slug and all tenant fields from the stored application.

Approval runs in one short Prisma transaction. It creates the `School`, its
active `SCHOOL_OWNER` membership, updates the application to `APPROVED`, writes
the audit events, and inserts a `NotificationOutbox` event. The unique
`School.sourceApplicationId` constraint is the final database-level guard
against duplicate provisioning. Concurrent unique conflicts are re-read and
return the already-created school where possible.

Queue delivery is intentionally not attempted inside the transaction because
pgmq cannot be committed atomically with the Prisma transaction through the
current tools. The worker's outbox dispatcher claims queued rows after commit,
publishes a versioned job, and marks the row sent. Failed dispatches retry with
a bounded limit and then become `FAILED`. No email provider is invoked in this
module.
