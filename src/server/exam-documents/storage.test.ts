import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { describe, expect, it } from 'vitest';
import { validateUploadMetadata } from '../storage';
describe('exam document upload metadata', () => { it('rejects oversized files', () => expect(() => validateUploadMetadata({ originalName:'paper.pdf', contentType:'application/pdf', sizeBytes:26 * 1024 * 1024 })).toThrow()); it('accepts office documents', () => expect(validateUploadMetadata({ originalName:'paper.docx', contentType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes:100 }).contentType).toContain('wordprocessingml')); });
