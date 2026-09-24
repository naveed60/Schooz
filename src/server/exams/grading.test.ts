import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { describe, expect, it } from 'vitest';
import { resolveGrade, validateGradingRanges } from './grading';
const ranges = [{ minPercentage: 0, maxPercentage: 59.99, grade: 'F', sortOrder: 1 }, { minPercentage: 60, maxPercentage: 89.99, grade: 'B', sortOrder: 2 }, { minPercentage: 90, maxPercentage: 100, grade: 'A', sortOrder: 3 }];
describe('grading boundaries', () => { it('assigns exact boundaries deterministically', () => { expect(resolveGrade(ranges, 59.99)?.grade).toBe('F'); expect(resolveGrade(ranges, 60)?.grade).toBe('B'); expect(resolveGrade(ranges, 90)?.grade).toBe('A'); }); it('rejects overlaps and gaps', () => { expect(() => validateGradingRanges([{...ranges[0], maxPercentage:60}, {...ranges[1]}, {...ranges[2]}])).toThrow('overlap'); expect(() => validateGradingRanges([{...ranges[0], maxPercentage:59}, {...ranges[1]}, {...ranges[2]}])).toThrow('gap'); }); });
