-- Module 05: append-only audit events and user-facing background job status.
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'PLATFORM_ADMIN', 'SYSTEM', 'WORKER', 'ANONYMOUS');
CREATE TYPE "BackgroundJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID,
    "actorUserId" UUID,
    "actorType" "AuditActorType" NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" VARCHAR(160),
    "requestId" VARCHAR(120),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "metadata" JSONB,
    "previousValues" JSONB,
    "newValues" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID,
    "type" VARCHAR(120) NOT NULL,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(120),
    "entityId" VARCHAR(160),
    "createdByUserId" UUID,
    "resultStorageKey" VARCHAR(512),
    "errorCode" VARCHAR(120),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "background_jobs_idempotencyKey_key" ON "background_jobs"("idempotencyKey");
CREATE INDEX "audit_logs_schoolId_createdAt_idx" ON "audit_logs"("schoolId", "createdAt");
CREATE INDEX "audit_logs_schoolId_entityType_entityId_createdAt_idx" ON "audit_logs"("schoolId", "entityType", "entityId", "createdAt");
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");
CREATE INDEX "background_jobs_schoolId_createdAt_idx" ON "background_jobs"("schoolId", "createdAt");
CREATE INDEX "background_jobs_status_createdAt_idx" ON "background_jobs"("status", "createdAt");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
