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

/** Live Auth lookup for actions that change data or require a current user record. */
export const requireAuthenticatedUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const authStarted = performance.now();
  const { data, error } = await supabase.auth.getUser();
  const authFinished = performance.now();
  if (error || !data.user) throw new Error('UNAUTHENTICATED');

  let profile = await prisma.userProfile.findUnique({ where: { id: data.user.id }, select: profileSelect });
  if (!profile) profile = await syncUserProfile(data.user, Boolean(data.user.email_confirmed_at));
  if (process.env.NODE_ENV === 'development') {
    console.info(`[timing] session: Supabase ${Math.round(authFinished - authStarted)}ms, profile ${Math.round(performance.now() - authFinished)}ms`);
  }
  return { identity: data.user, profile };
});

/** Signed claims and a current database role for read-only platform pages. */
export const requireAuthenticatedClaimsUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const authStarted = performance.now();
  const { data, error } = await supabase.auth.getClaims();
  const authFinished = performance.now();
  if (error || !data?.claims?.sub) throw new Error('UNAUTHENTICATED');

  let profile = await prisma.userProfile.findUnique({ where: { id: data.claims.sub }, select: profileSelect });
  if (!profile) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user || userData.user.id !== data.claims.sub) throw new Error('UNAUTHENTICATED');
    profile = await syncUserProfile(userData.user, Boolean(userData.user.email_confirmed_at));
  }
  if (process.env.NODE_ENV === 'development') {
    console.info(`[timing] session: claims ${Math.round(authFinished - authStarted)}ms, profile ${Math.round(performance.now() - authFinished)}ms`);
  }
  return { profile };
});
