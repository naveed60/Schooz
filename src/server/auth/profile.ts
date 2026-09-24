import 'server-only';

import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { prisma } from '@schooz/database';
import { createSupabaseServerClient } from './supabase-server';

function normalizedEmail(user: User) {
  return user.email?.trim().toLowerCase();
}

export async function syncUserProfile(user: User, verified: boolean) {
  const email = normalizedEmail(user);
  if (!email) throw new Error('AUTH_PROFILE_EMAIL_MISSING');

  const metadata = user.user_metadata as Record<string, unknown>;
  const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : '';
  const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : '';
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;

  return prisma.userProfile.upsert({
    where: { id: user.id },
    create: { id: user.id, email, firstName, lastName, avatarUrl, status: verified ? 'ACTIVE' : 'INVITED' },
    update: { email, firstName, lastName, avatarUrl, ...(verified ? { status: 'ACTIVE' } : {}) },
    select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, platformRole: true, status: true },
  });
}

const profileSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  platformRole: true,
  status: true,
} as const;

/** Cache authentication for the duration of one server render. */
export const requireAuthenticatedUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('UNAUTHENTICATED');

  // Login and callback perform profile synchronization. Read-only pages only
  // need the existing profile and must not write on every navigation.
  let profile = await prisma.userProfile.findUnique({ where: { id: data.user.id }, select: profileSelect });
  if (!profile) profile = await syncUserProfile(data.user, Boolean(data.user.email_confirmed_at));
  return { identity: data.user, profile };
});
