import type { GradingItem } from '../exams/schemas';
import { resolveGrade } from '../exams/grading';

export type ResultSubjectInput = {
  subjectId: string;
  subjectName?: string;
  marksObtained: number | null;
  maxMarks: number;
  passMarks?: number;
  grade?: string | null;
  remarks?: string | null;
};

export type StudentResult = {
  subjects: ResultSubjectInput[];
  totalObtained: number;
  totalPossible: number;
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
  status: 'COMPLETE' | 'INCOMPLETE';
};

export function calculateStudentResult(subjects: ResultSubjectInput[], gradingItems: GradingItem[]): StudentResult {
  const totalPossible = subjects.reduce((sum, subject) => sum + subject.maxMarks, 0);
  const totalObtained = subjects.reduce((sum, subject) => sum + (subject.marksObtained ?? 0), 0);
  const incomplete = subjects.some((subject) => subject.marksObtained === null);
  if (incomplete || totalPossible <= 0) {
    return { subjects, totalObtained, totalPossible, percentage: null, grade: null, passed: null, status: 'INCOMPLETE' };
  }
  const percentage = Number(((totalObtained / totalPossible) * 100).toFixed(2));
  const grade = resolveGrade(gradingItems, percentage)?.grade ?? null;
  const passed = subjects.every((subject) => subject.marksObtained! >= (subject.passMarks ?? 0));
  return { subjects, totalObtained, totalPossible, percentage, grade, passed, status: 'COMPLETE' };
}
