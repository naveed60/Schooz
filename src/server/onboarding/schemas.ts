import { z } from 'zod';

const optionalText = z.preprocess(value => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().max(2048).optional());

export const schoolApplicationSchema = z.object({
  schoolName: z.string().trim().min(2).max(160),
  legalName: optionalText.pipe(z.string().max(200).optional()),
  registrationNumber: optionalText.pipe(z.string().max(120).optional()),
  schoolType: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(320).transform(value => value.toLowerCase()),
  phone: z.string().trim().regex(/^\+?[0-9().\-\s]{7,32}$/),
  website: z.preprocess(value => {
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    return value.trim();
  }, z.string().url().max(2048).optional()),
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: optionalText.pipe(z.string().max(200).optional()),
  city: z.string().trim().min(2).max(100),
  stateOrRegion: z.string().trim().min(2).max(100),
  postalCode: optionalText.pipe(z.string().max(32).optional()),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  principalName: optionalText.pipe(z.string().max(160).optional()),
});

export type SchoolApplicationInput = z.infer<typeof schoolApplicationSchema>;

export const applicationDocumentSchema = z.object({
  documentType: z.string().trim().min(2).max(80),
  originalFileName: z.string().trim().min(1).max(180).refine(name => !/[\\/\0]/.test(name), 'Invalid file name'),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export type ApplicationDocumentInput = z.infer<typeof applicationDocumentSchema>;

export function parseSchoolApplication(input: unknown) {
  const result = schoolApplicationSchema.safeParse(input);
  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, data: result.data };
}

export function parseApplicationDocument(input: unknown) {
  const result = applicationDocumentSchema.safeParse(input);
  if (!result.success) return { success: false as const, error: result.error };
  return { success: true as const, data: result.data };
}
