-- Module 06: applicant-owned school applications and private verification documents.
CREATE TYPE "SchoolApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

CREATE TABLE "school_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicantUserId" UUID NOT NULL,
    "schoolName" VARCHAR(160) NOT NULL,
    "legalName" VARCHAR(200),
    "registrationNumber" VARCHAR(120),
    "schoolType" VARCHAR(80) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "website" VARCHAR(2048),
    "addressLine1" VARCHAR(200) NOT NULL,
    "addressLine2" VARCHAR(200),
    "city" VARCHAR(100) NOT NULL,
    "stateOrRegion" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(32),
    "countryCode" CHAR(2) NOT NULL,
    "principalName" VARCHAR(160),
    "status" "SchoolApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMPTZ(3),
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewedByUserId" UUID,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "school_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "school_application_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "applicationId" UUID NOT NULL,
    "storageKey" VARCHAR(512) NOT NULL,
    "originalFileName" VARCHAR(180) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "documentType" VARCHAR(80) NOT NULL,
    "uploadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "school_application_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "school_applications_status_submittedAt_idx" ON "school_applications"("status", "submittedAt");
CREATE INDEX "school_applications_applicantUserId_createdAt_idx" ON "school_applications"("applicantUserId", "createdAt");
CREATE INDEX "school_application_documents_applicationId_idx" ON "school_application_documents"("applicationId");

ALTER TABLE "school_applications" ADD CONSTRAINT "school_applications_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_applications" ADD CONSTRAINT "school_applications_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "school_application_documents" ADD CONSTRAINT "school_application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "school_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
