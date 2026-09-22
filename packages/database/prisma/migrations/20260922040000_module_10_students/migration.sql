CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'CANCELLED');

CREATE TABLE "students" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "schoolId" UUID NOT NULL,
  "admissionNumber" VARCHAR(80) NOT NULL, "firstName" VARCHAR(100) NOT NULL, "middleName" VARCHAR(100), "lastName" VARCHAR(100) NOT NULL,
  "preferredName" VARCHAR(100), "gender" VARCHAR(40), "dateOfBirth" DATE, "email" VARCHAR(320), "phone" VARCHAR(40),
  "photoStorageKey" VARCHAR(512), "admissionDate" DATE NOT NULL, "bloodGroup" VARCHAR(10), "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL, "archivedAt" TIMESTAMPTZ(3),
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"), CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "guardians" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "schoolId" UUID NOT NULL, "userId" UUID, "firstName" VARCHAR(100) NOT NULL, "lastName" VARCHAR(100) NOT NULL,
  "email" VARCHAR(320), "phone" VARCHAR(40) NOT NULL, "alternatePhone" VARCHAR(40), "occupation" VARCHAR(120), "address" VARCHAR(500),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "guardians_pkey" PRIMARY KEY ("id"), CONSTRAINT "guardians_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "guardians_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "student_guardians" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "schoolId" UUID NOT NULL, "studentId" UUID NOT NULL, "guardianId" UUID NOT NULL,
  "relationship" VARCHAR(60) NOT NULL, "isPrimary" BOOLEAN NOT NULL DEFAULT false, "receivesNotifications" BOOLEAN NOT NULL DEFAULT true, "canPickup" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_guardians_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "student_enrollments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "schoolId" UUID NOT NULL, "studentId" UUID NOT NULL, "academicYearId" UUID NOT NULL, "classId" UUID NOT NULL, "sectionId" UUID NOT NULL,
  "rollNumber" VARCHAR(40), "enrollmentDate" DATE NOT NULL, "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_enrollments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_enrollments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "student_enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "students_schoolId_admissionNumber_key" ON "students"("schoolId", "admissionNumber");
CREATE INDEX "students_schoolId_status_idx" ON "students"("schoolId", "status");
CREATE INDEX "students_schoolId_createdAt_id_idx" ON "students"("schoolId", "createdAt", "id");
CREATE UNIQUE INDEX "guardians_userId_key" ON "guardians"("userId");
CREATE INDEX "guardians_schoolId_lastName_firstName_idx" ON "guardians"("schoolId", "lastName", "firstName");
CREATE INDEX "guardians_schoolId_phone_idx" ON "guardians"("schoolId", "phone");
CREATE UNIQUE INDEX "student_guardians_studentId_guardianId_key" ON "student_guardians"("studentId", "guardianId");
CREATE INDEX "student_guardians_schoolId_studentId_idx" ON "student_guardians"("schoolId", "studentId");
CREATE INDEX "student_guardians_schoolId_guardianId_idx" ON "student_guardians"("schoolId", "guardianId");
CREATE INDEX "student_enrollments_schoolId_academicYearId_classId_sectionId_idx" ON "student_enrollments"("schoolId", "academicYearId", "classId", "sectionId");
CREATE INDEX "student_enrollments_schoolId_studentId_academicYearId_idx" ON "student_enrollments"("schoolId", "studentId", "academicYearId");
CREATE INDEX "student_enrollments_schoolId_academicYearId_status_idx" ON "student_enrollments"("schoolId", "academicYearId", "status");
CREATE UNIQUE INDEX "student_enrollments_one_active_per_year_idx" ON "student_enrollments"("studentId", "academicYearId") WHERE "status" = 'ACTIVE';
