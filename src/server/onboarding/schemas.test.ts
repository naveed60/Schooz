import { describe, expect, it } from 'vitest';
import { parseApplicationDocument, parseSchoolApplication } from './schemas';

const validApplication = {
  schoolName: 'North Star School', schoolType: 'PRIVATE', email: 'ADMIN@EXAMPLE.COM', phone: '+92 300 1234567',
  addressLine1: '1 Main Street', city: 'Lahore', stateOrRegion: 'Punjab', countryCode: 'pk',
};

describe('school application validation', () => {
  it('normalizes email and country code', () => {
    const result = parseSchoolApplication(validApplication);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ email: 'admin@example.com', countryCode: 'PK' });
  });

  it('rejects invalid URLs, phone numbers and countries', () => {
    expect(parseSchoolApplication({ ...validApplication, website: 'not-a-url' }).success).toBe(false);
    expect(parseSchoolApplication({ ...validApplication, phone: 'x' }).success).toBe(false);
    expect(parseSchoolApplication({ ...validApplication, countryCode: 'Pakistan' }).success).toBe(false);
  });

  it('rejects unsupported and oversized documents', () => {
    expect(parseApplicationDocument({ documentType: 'LICENSE', originalFileName: 'x.exe', mimeType: 'application/pdf', sizeBytes: 10 }).success).toBe(true);
    expect(parseApplicationDocument({ documentType: 'LICENSE', originalFileName: 'x.pdf', mimeType: 'application/pdf', sizeBytes: 11 * 1024 * 1024 }).success).toBe(false);
    expect(parseApplicationDocument({ documentType: 'LICENSE', originalFileName: 'x.exe', mimeType: 'application/x-msdownload', sizeBytes: 10 }).success).toBe(false);
  });
});
