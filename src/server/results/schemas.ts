import { z } from 'zod';

export const markEntrySchema = z.object({
  studentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  marksObtained: z.number().finite().min(0).nullable(),
  remarks: z.string().max(500).optional(),
});

export const bulkMarksSchema = z.object({
  examId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  status: z.enum(['DRAFT', 'SUBMITTED']).default('DRAFT'),
  entries: z.array(markEntrySchema).min(1).max(500),
});

export type BulkMarksInput = z.infer<typeof bulkMarksSchema>;
