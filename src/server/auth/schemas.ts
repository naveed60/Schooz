import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(128),
});

export const registrationSchema = credentialsSchema.extend({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export const passwordResetSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine(value => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
