import { z } from 'zod';
export const examDocumentTypeSchema = z.enum(['QUESTION_PAPER','ANSWER_KEY','MARK_SHEET','SYLLABUS','INSTRUCTIONS','OTHER']);
export const examDocumentInputSchema = z.object({ examId: z.string().uuid(), classId: z.string().uuid().optional(), subjectId: z.string().uuid().optional(), type: examDocumentTypeSchema });
export type ExamDocumentType = z.infer<typeof examDocumentTypeSchema>;
