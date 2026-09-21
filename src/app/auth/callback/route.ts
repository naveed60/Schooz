import { NextResponse } from 'next/server';
import { getAuthConfig } from '@/server/auth/config';
import { getSafeRedirectPath } from '@/server/auth/redirects';
import { syncUserProfile } from '@/server/auth/profile';
import { createSupabaseServerClient } from '@/server/auth/supabase-server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'));
  const config = getAuthConfig();

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await syncUserProfile(data.user, Boolean(data.user.email_confirmed_at));
      return NextResponse.redirect(new URL(next, config.APP_URL));
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=callback', config.APP_URL)
  );
}
