import 'server-only';

import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './supabase-server';

function normalizedEmail(user: User) {
  return user.email?.trim().toLowerCase();
}

export async function syncUserProfile(user: User, verified: boolean) {
  const { prisma } = await import('@schooz/database');
  const email = normalizedEmail(user);
  if (!email) throw new Error('AUTH_PROFILE_EMAIL_MISSING');

  const metadata = user.user_metadata as Record<string, unknown>;
  const firstName =
    typeof metadata.first_name === 'string' ? metadata.first_name : '';
  const lastName =
    typeof metadata.last_name === 'string' ? metadata.last_name : '';
  const avatarUrl =
    typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;

  return prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email,
      firstName,
      lastName,
      avatarUrl,
      status: verified ? 'ACTIVE' : 'INVITED',
    },
    update: {
      email,
      firstName,
      lastName,
      avatarUrl,
      ...(verified ? { status: 'ACTIVE' } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      platformRole: true,
      status: true,
    },
  });
}

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('UNAUTHENTICATED');

  const verified = Boolean(data.user.email_confirmed_at);
  const profile = await syncUserProfile(data.user, verified);
  return { identity: data.user, profile };
}
