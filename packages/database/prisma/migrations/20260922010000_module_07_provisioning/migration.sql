-- Module 07: platform provisioning fields and transactional notification outbox.
ALTER TABLE "schools"
  ADD COLUMN "legalName" VARCHAR(200),
  ADD COLUMN "registrationNumber" VARCHAR(120),
  ADD COLUMN "phone" VARCHAR(40) NOT NULL DEFAULT '',
  ADD COLUMN "website" VARCHAR(2048),
  ADD COLUMN "logoStorageKey" VARCHAR(512),
  ADD COLUMN "addressLine1" VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN "addressLine2" VARCHAR(200),
  ADD COLUMN "city" VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN "stateOrRegion" VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN "postalCode" VARCHAR(32),
  ADD COLUMN "sourceApplicationId" UUID;

CREATE UNIQUE INDEX "schools_sourceApplicationId_key" ON "schools"("sourceApplicationId");
ALTER TABLE "schools" ADD CONSTRAINT "schools_sourceApplicationId_fkey" FOREIGN KEY ("sourceApplicationId") REFERENCES "school_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "OutboxStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'FAILED');

CREATE TABLE "notification_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventKey" VARCHAR(255) NOT NULL,
    "type" VARCHAR(120) NOT NULL,
    "applicationId" UUID,
    "schoolId" UUID,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),
    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_outbox_eventKey_key" ON "notification_outbox"("eventKey");
CREATE INDEX "notification_outbox_status_availableAt_idx" ON "notification_outbox"("status", "availableAt");
CREATE INDEX "notification_outbox_applicationId_createdAt_idx" ON "notification_outbox"("applicationId", "createdAt");

ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "school_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
