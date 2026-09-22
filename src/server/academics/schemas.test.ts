import { describe, expect, it } from 'vitest';
import { academicYearSchema, classSubjectSchema } from './schemas';

describe('academic schemas', () => {
  it('requires an end date after the start date', () => {
    expect(academicYearSchema.safeParse({ name: '2026', startDate: '2026-01-01', endDate: '2025-12-31' }).success).toBe(false);
  });
  it('rejects pass marks above maximum marks', () => {
    expect(classSubjectSchema.safeParse({ academicYearId: '00000000-0000-0000-0000-000000000001', classId: '00000000-0000-0000-0000-000000000002', subjectId: '00000000-0000-0000-0000-000000000003', maxMarks: 50, passMarks: 51 }).success).toBe(false);
  });
});
