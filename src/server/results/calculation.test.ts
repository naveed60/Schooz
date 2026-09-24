import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { describe, expect, it } from 'vitest';
import { calculateStudentResult } from './calculation';

const grades = [
  { minPercentage: 0, maxPercentage: 49.99, grade: 'F', sortOrder: 1 },
  { minPercentage: 50, maxPercentage: 89.99, grade: 'B', sortOrder: 2 },
  { minPercentage: 90, maxPercentage: 100, grade: 'A', sortOrder: 3 },
];

describe('result calculation', () => {
  it('uses deterministic percentage boundaries', () => {
    const result = calculateStudentResult([{ subjectId: 'math', marksObtained: 90, maxMarks: 100, passMarks: 40 }], grades);
    expect(result.percentage).toBe(90);
    expect(result.grade).toBe('A');
    expect(result.passed).toBe(true);
  });

  it('keeps incomplete results unpublished', () => {
    const result = calculateStudentResult([{ subjectId: 'math', marksObtained: null, maxMarks: 100, passMarks: 40 }], grades);
    expect(result.status).toBe('INCOMPLETE');
    expect(result.percentage).toBeNull();
    expect(result.passed).toBeNull();
  });

  it('fails a complete result when a subject is below its pass mark', () => {
    const result = calculateStudentResult([{ subjectId: 'math', marksObtained: 39, maxMarks: 100, passMarks: 40 }], grades);
    expect(result.status).toBe('COMPLETE');
    expect(result.passed).toBe(false);
  });
});
