import 'server-only';
import { prisma } from '@schooz/database';
import { PERMISSIONS, requireSchoolPermission, type SchoolContext } from '../authorization';
import { auditService } from '../audit';
import { ConflictError, NotFoundError } from '../errors';
import { bulkMarksSchema } from './schemas';
import { calculateStudentResult } from './calculation';

type ResultsDb = Pick<typeof prisma, 'exam' | 'examSchedule' | 'studentMark' | 'studentEnrollment' | 'gradingScheme' | 'resultPublication' | '$transaction'>;
const read = (context: SchoolContext) => requireSchoolPermission(context, PERMISSIONS.EXAMS_READ);
const manage = (context: SchoolContext) => requireSchoolPermission(context, PERMISSIONS.RESULTS_MANAGE);
const missing = (message: string): never => { throw new NotFoundError(message); };
const dbConflict = (error: unknown): never => { if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') throw new ConflictError('This mark or publication already exists.'); throw error; };

export async function saveClassMarks(context: SchoolContext, input: unknown, db: ResultsDb = prisma) {
  manage(context);
  const data = bulkMarksSchema.parse(input);
  const exam = await db.exam.findFirst({ where: { id: data.examId, schoolId: context.schoolId }, select: { id: true, schoolId: true, academicYearId: true } });
  if (!exam) return missing('Exam not found.');
  const schedule = await db.examSchedule.findFirst({ where: { schoolId: context.schoolId, examId: data.examId, classId: data.classId, subjectId: data.subjectId }, select: { maxMarks: true, passMarks: true } });
  if (!schedule) return missing('Exam subject schedule not found.');
  const enrollments = await db.studentEnrollment.findMany({ where: { schoolId: context.schoolId, academicYearId: exam.academicYearId, classId: data.classId, id: { in: data.entries.map((entry) => entry.enrollmentId) }, studentId: { in: data.entries.map((entry) => entry.studentId) } }, select: { id: true, studentId: true } });
  const valid = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment.studentId]));
  if (valid.size !== data.entries.length || data.entries.some((entry) => valid.get(entry.enrollmentId) !== entry.studentId)) throw new ConflictError('Every student must have a matching enrollment for this class and academic year.');
  const maxMarks = Number(schedule.maxMarks);
  for (const entry of data.entries) if (entry.marksObtained !== null && entry.marksObtained > maxMarks) throw new ConflictError(`Marks cannot exceed ${maxMarks}.`);
  try {
    return await db.$transaction(data.entries.map((entry) => db.studentMark.upsert({ where: { schoolId_examId_studentId_subjectId: { schoolId: context.schoolId, examId: data.examId, studentId: entry.studentId, subjectId: data.subjectId } }, create: { schoolId: context.schoolId, examId: data.examId, studentId: entry.studentId, enrollmentId: entry.enrollmentId, subjectId: data.subjectId, marksObtained: entry.marksObtained, maxMarks: schedule.maxMarks, remarks: entry.remarks, status: data.status, enteredByUserId: context.userId, updatedByUserId: context.userId }, update: { enrollmentId: entry.enrollmentId, marksObtained: entry.marksObtained, maxMarks: schedule.maxMarks, remarks: entry.remarks, status: data.status, updatedByUserId: context.userId } })));
  } catch (error) { dbConflict(error); }
}

export async function getClassResults(context: SchoolContext, input: { examId: string; classId: string }, db: ResultsDb = prisma) {
  read(context);
  const exam = await db.exam.findFirst({ where: { id: input.examId, schoolId: context.schoolId }, select: { id: true, academicYearId: true } });
  if (!exam) return missing('Exam not found.');
  const [schedules, enrollments, scheme] = await Promise.all([
    db.examSchedule.findMany({ where: { schoolId: context.schoolId, examId: input.examId, classId: input.classId }, select: { subjectId: true, maxMarks: true, passMarks: true, subject: { select: { name: true } } }, orderBy: { subjectId: 'asc' }, take: 200 }),
    db.studentEnrollment.findMany({ where: { schoolId: context.schoolId, academicYearId: exam.academicYearId, classId: input.classId, status: 'ACTIVE' }, select: { id: true, studentId: true, student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true } } }, orderBy: [{ rollNumber: 'asc' }, { studentId: 'asc' }], take: 500 }),
    db.gradingScheme.findFirst({ where: { schoolId: context.schoolId, isDefault: true }, include: { items: { orderBy: { sortOrder: 'asc' } } } }),
  ]);
  const marks = await db.studentMark.findMany({ where: { schoolId: context.schoolId, examId: input.examId, studentId: { in: enrollments.map((enrollment) => enrollment.studentId) }, subjectId: { in: schedules.map((schedule) => schedule.subjectId) } }, select: { studentId: true, subjectId: true, marksObtained: true, maxMarks: true, grade: true, remarks: true }, take: 5000 });
  const byStudent = new Map<string, typeof marks>();
  for (const mark of marks) byStudent.set(mark.studentId, [...(byStudent.get(mark.studentId) ?? []), mark]);
  const items = scheme?.items.map((item, sortOrder) => ({ minPercentage: Number(item.minPercentage), maxPercentage: Number(item.maxPercentage), grade: item.grade, sortOrder, gradePoint: item.gradePoint ? Number(item.gradePoint) : undefined, remark: item.remark ?? undefined })) ?? [];
  return enrollments.map((enrollment) => calculateStudentResult(schedules.map((schedule) => { const mark = byStudent.get(enrollment.studentId)?.find((candidate) => candidate.subjectId === schedule.subjectId); return { subjectId: schedule.subjectId, subjectName: schedule.subject.name, marksObtained: mark?.marksObtained === null || mark?.marksObtained === undefined ? null : Number(mark.marksObtained), maxMarks: Number(schedule.maxMarks), passMarks: Number(schedule.passMarks), grade: mark?.grade, remarks: mark?.remarks }; }), items));
}

export async function publishClassResults(context: SchoolContext, input: { examId: string; classId: string }, db: ResultsDb = prisma) {
  manage(context);
  const exam = await db.exam.findFirst({ where: { id: input.examId, schoolId: context.schoolId }, select: { id: true, academicYearId: true } });
  if (!exam) return missing('Exam not found.');
  const [schedules, enrollments] = await Promise.all([
    db.examSchedule.findMany({ where: { schoolId: context.schoolId, examId: input.examId, classId: input.classId }, select: { subjectId: true }, take: 200 }),
    db.studentEnrollment.findMany({ where: { schoolId: context.schoolId, academicYearId: exam.academicYearId, classId: input.classId, status: 'ACTIVE' }, select: { studentId: true }, take: 500 }),
  ]);
  if (!schedules.length || !enrollments.length) throw new ConflictError('This class has no scheduled subjects or active students.');
  const marks = await db.studentMark.findMany({ where: { schoolId: context.schoolId, examId: input.examId, studentId: { in: enrollments.map((enrollment) => enrollment.studentId) }, subjectId: { in: schedules.map((schedule) => schedule.subjectId) }, status: { in: ['SUBMITTED', 'VERIFIED'] }, marksObtained: { not: null } }, select: { studentId: true, subjectId: true }, take: 5000 });
  const required = enrollments.length * schedules.length;
  if (marks.length !== required) throw new ConflictError('All scheduled student marks must be submitted or verified before publication.');
  try {
    const publication = await db.$transaction(async (tx) => {
      const created = await tx.resultPublication.create({ data: { schoolId: context.schoolId, examId: input.examId, classId: input.classId, publishedByUserId: context.userId } });
      await tx.studentMark.updateMany({ where: { schoolId: context.schoolId, examId: input.examId, studentId: { in: enrollments.map((enrollment) => enrollment.studentId) }, subjectId: { in: schedules.map((schedule) => schedule.subjectId) } }, data: { status: 'PUBLISHED', updatedByUserId: context.userId } });
      const scheduledClasses = await tx.examSchedule.findMany({ where: { schoolId: context.schoolId, examId: input.examId }, select: { classId: true }, distinct: ["classId"] });
      const publishedClasses = await tx.resultPublication.count({ where: { schoolId: context.schoolId, examId: input.examId } });
      if (publishedClasses >= scheduledClasses.length) await tx.exam.update({ where: { id: input.examId }, data: { status: "RESULTS_PUBLISHED" } });
      return created;
    });
    await auditService.appendForSchool(context, { action: 'RESULTS_PUBLISHED', entityType: 'ResultPublication', entityId: publication.id, actorType: 'USER', metadata: { examId: input.examId, classId: input.classId } });
    return publication;
  } catch (error) { dbConflict(error); }
}
