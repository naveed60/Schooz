import { z } from 'zod';

export const schoolSettingsSchema = z.object({
  timezone: z.string().trim().min(1).max(64),
  currencyCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']),
  studentNumberPrefix: z.preprocess(value => typeof value === 'string' && value.trim() === '' ? undefined : value, z.string().trim().regex(/^[A-Z0-9_-]{1,20}$/).optional()),
  invoiceNumberPrefix: z.preprocess(value => typeof value === 'string' && value.trim() === '' ? undefined : value, z.string().trim().regex(/^[A-Z0-9_-]{1,20}$/).optional()),
});

export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;

export const schoolLogoMetadataSchema = z.object({
  originalName: z.string().trim().min(1).max(180).refine(name => !/[\\/\0]/.test(name), 'Invalid file name'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
});
