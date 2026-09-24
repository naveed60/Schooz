CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "teachers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "schoolId" UUID NOT NULL, "userId" UUID, "employeeNumber" VARCHAR(80) NOT NULL, "firstName" VARCHAR(100) NOT NULL, "middleName" VARCHAR(100), "lastName" VARCHAR(100) NOT NULL, "email" VARCHAR(320), "phone" VARCHAR(40), "dateOfBirth" DATE, "joinDate" DATE NOT NULL, "qualification" VARCHAR(200), "designation" VARCHAR(120), "photoStorageKey" VARCHAR(512), "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "teachers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "teachers_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE SET NULL
);
CREATE TABLE "teacher_assignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "schoolId" UUID NOT NULL, "academicYearId" UUID NOT NULL, "teacherId" UUID NOT NULL, "classId" UUID NOT NULL, "sectionId" UUID, "subjectId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "teacher_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE,
  CONSTRAINT "teacher_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT,
  CONSTRAINT "teacher_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT,
  CONSTRAINT "teacher_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "academic_classes"("id") ON DELETE RESTRICT,
  CONSTRAINT "teacher_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT,
  CONSTRAINT "teacher_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "teachers_schoolId_employeeNumber_key" ON "teachers"("schoolId", "employeeNumber");
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");
CREATE INDEX "teachers_schoolId_status_idx" ON "teachers"("schoolId", "status");
CREATE INDEX "teachers_schoolId_createdAt_id_idx" ON "teachers"("schoolId", "createdAt", "id");
CREATE UNIQUE INDEX "teacher_assignments_tuple_key" ON "teacher_assignments"("academicYearId", "teacherId", "classId", "sectionId", "subjectId");
CREATE INDEX "teacher_assignments_schoolId_academicYearId_teacherId_idx" ON "teacher_assignments"("schoolId", "academicYearId", "teacherId");
CREATE INDEX "teacher_assignments_schedule_lookup_idx" ON "teacher_assignments"("schoolId", "academicYearId", "classId", "sectionId", "subjectId");
