import { z } from 'zod';

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export function parseDatabaseEnv(
  values: Record<string, string | undefined> = process.env
) {
  return databaseEnvSchema.parse(values);
}
