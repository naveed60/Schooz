-- Module 04: finalize platform, school status, membership role and membership status enums.
ALTER TYPE "PlatformRole" RENAME VALUE 'ADMIN' TO 'PLATFORM_ADMIN';

-- Rebuild the school status enum so the foundation-only PENDING value is not
-- left available to application code. Existing pending schools are treated as
-- active because provisioning is not implemented in V1.
ALTER TYPE "SchoolStatus" RENAME TO "SchoolStatus_old";
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
ALTER TABLE "schools" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "schools"
  ALTER COLUMN "status" TYPE "SchoolStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'ACTIVE'
      WHEN 'APPROVED' THEN 'ACTIVE'
      ELSE "status"::text
    END
  )::"SchoolStatus";
DROP TYPE "SchoolStatus_old";

ALTER TYPE "MembershipRole" RENAME VALUE 'OWNER' TO 'SCHOOL_OWNER';
ALTER TYPE "MembershipRole" RENAME VALUE 'ADMIN' TO 'SCHOOL_ADMIN';
ALTER TYPE "MembershipRole" RENAME VALUE 'STAFF' TO 'TEACHER';
ALTER TYPE "MembershipRole" ADD VALUE 'ACCOUNTANT';
ALTER TYPE "MembershipRole" ADD VALUE 'EXAM_CONTROLLER';
ALTER TYPE "MembershipRole" ADD VALUE 'RECEPTIONIST';
ALTER TYPE "MembershipRole" ADD VALUE 'PARENT';
ALTER TYPE "MembershipRole" ADD VALUE 'STUDENT';

ALTER TYPE "MembershipStatus" ADD VALUE 'REMOVED';

ALTER TABLE "schools" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
