-- Module 09: tenant-scoped academic structure and database invariants.
CREATE TYPE "AcademicRecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "academic_years" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AcademicRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "academic_years_dates_check" CHECK ("endDate" > "startDate")
);

CREATE TABLE "academic_classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40),
    "sortOrder" INTEGER,
    "status" "AcademicRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "academic_classes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "capacity" INTEGER,
    "homeroomTeacherId" UUID,
    "status" "AcademicRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sections_capacity_check" CHECK ("capacity" IS NULL OR "capacity" >= 0)
);

CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "status" "AcademicRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "class_subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "maxMarks" INTEGER,
    "passMarks" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "class_subjects_marks_check" CHECK (
      ("maxMarks" IS NULL OR "maxMarks" >= 0) AND
      ("passMarks" IS NULL OR "passMarks" >= 0) AND
      ("passMarks" IS NULL OR "maxMarks" IS NULL OR "passMarks" <= "maxMarks")
    )
);

CREATE UNIQUE INDEX "academic_years_schoolId_name_key" ON "academic_years"("schoolId", "name");
CREATE UNIQUE INDEX "academic_years_one_current_per_school_idx" ON "academic_years"("schoolId") WHERE "isCurrent" = true;
CREATE INDEX "academic_years_schoolId_status_startDate_idx" ON "academic_years"("schoolId", "status", "startDate");
CREATE UNIQUE INDEX "academic_classes_schoolId_name_key" ON "academic_classes"("schoolId", "name");
CREATE UNIQUE INDEX "academic_classes_schoolId_code_key" ON "academic_classes"("schoolId", "code") WHERE "code" IS NOT NULL;
CREATE INDEX "academic_classes_schoolId_status_sortOrder_idx" ON "academic_classes"("schoolId", "status", "sortOrder");
CREATE UNIQUE INDEX "sections_schoolId_academicYearId_classId_name_key" ON "sections"("schoolId", "academicYearId", "classId", "name");
CREATE INDEX "sections_schoolId_academicYearId_classId_status_idx" ON "sections"("schoolId", "academicYearId", "classId", "status");
CREATE UNIQUE INDEX "subjects_schoolId_code_key" ON "subjects"("schoolId", "code");
CREATE INDEX "subjects_schoolId_status_idx" ON "subjects"("schoolId", "status");
CREATE UNIQUE INDEX "class_subjects_schoolId_academicYearId_classId_subjectId_key" ON "class_subjects"("schoolId", "academicYearId", "classId", "subjectId");
CREATE INDEX "class_subjects_schoolId_academicYearId_classId_idx" ON "class_subjects"("schoolId", "academicYearId", "classId");

ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_classId_fkey" FOREIGN KEY ("classId") REFERENCES "academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
