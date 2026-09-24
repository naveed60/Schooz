CREATE TYPE "MarkStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'PUBLISHED');

CREATE TABLE "student_marks" (
  "id" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "examId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "subjectId" UUID NOT NULL,
  "marksObtained" DECIMAL(8,2),
  "maxMarks" DECIMAL(8,2) NOT NULL,
  "grade" VARCHAR(20),
  "remarks" VARCHAR(500),
  "status" "MarkStatus" NOT NULL DEFAULT 'DRAFT',
  "enteredByUserId" UUID NOT NULL,
  "updatedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "student_marks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "student_marks_bounds_check" CHECK ("maxMarks" > 0 AND ("marksObtained" IS NULL OR ("marksObtained" >= 0 AND "marksObtained" <= "maxMarks")))
);

CREATE UNIQUE INDEX "student_marks_schoolId_examId_studentId_subjectId_key" ON "student_marks"("schoolId", "examId", "studentId", "subjectId");
CREATE INDEX "student_marks_schoolId_examId_studentId_idx" ON "student_marks"("schoolId", "examId", "studentId");
CREATE INDEX "student_marks_schoolId_examId_subjectId_idx" ON "student_marks"("schoolId", "examId", "subjectId");

CREATE TABLE "result_publications" (
  "id" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "examId" UUID NOT NULL,
  "classId" UUID NOT NULL,
  "publishedByUserId" UUID NOT NULL,
  "publishedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "result_publications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "result_publications_schoolId_examId_classId_key" ON "result_publications"("schoolId", "examId", "classId");
CREATE INDEX "result_publications_schoolId_examId_idx" ON "result_publications"("schoolId", "examId");

ALTER TABLE "student_marks" ADD CONSTRAINT "student_marks_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_marks" ADD CONSTRAINT "student_marks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_marks" ADD CONSTRAINT "student_marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_marks" ADD CONSTRAINT "student_marks_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_marks" ADD CONSTRAINT "student_marks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_marks" ADD CONSTRAINT "student_marks_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_marks" ADD CONSTRAINT "student_marks_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_classId_fkey" FOREIGN KEY ("classId") REFERENCES "academic_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "result_publications" ADD CONSTRAINT "result_publications_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
