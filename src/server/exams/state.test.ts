import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { describe, expect, it } from 'vitest';
import { assertExamStatusTransition } from './state';
describe('exam transitions', () => { it('allows draft to scheduled and scheduled to ongoing', () => { expect(() => assertExamStatusTransition('DRAFT','SCHEDULED')).not.toThrow(); expect(() => assertExamStatusTransition('SCHEDULED','ONGOING')).not.toThrow(); }); it('does not allow generic results publication', () => expect(() => assertExamStatusTransition('COMPLETED','RESULTS_PUBLISHED')).toThrow('results workflow')); });
