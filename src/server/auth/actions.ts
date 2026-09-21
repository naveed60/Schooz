'use server';

import { redirect } from 'next/navigation';
import { getAuthConfig } from './config';
import { getSafeRedirectPath } from './redirects';
import { createSupabaseServerClient } from './supabase-server';
import { syncUserProfile } from './profile';
import {
  credentialsSchema,
  passwordResetSchema,
  registrationSchema,
} from './schemas';

function value(formData: FormData, name: string) {
  const input = formData.get(name);
  return typeof input === 'string' ? input : '';
}

export async function registerAction(formData: FormData) {
  const parsed = registrationSchema.safeParse({
    email: value(formData, 'email'),
    password: value(formData, 'password'),
    firstName: value(formData, 'firstName'),
    lastName: value(formData, 'lastName'),
  });
  if (!parsed.success) redirect('/register?error=invalid');

  const config = getAuthConfig();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${config.APP_URL}/auth/callback?next=/platform`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
      },
    },
  });

  if (error || !data.user) redirect('/register?error=generic');
  if (data.session)
    await syncUserProfile(data.user, Boolean(data.user.email_confirmed_at));
  redirect('/login?message=check-email');
}

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: value(formData, 'email'),
    password: value(formData, 'password'),
  });
  const next = getSafeRedirectPath(value(formData, 'next'));
  if (!parsed.success)
    redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user)
    redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect(`/login?error=unverified&next=${encodeURIComponent(next)}`);
  }

  await syncUserProfile(data.user, true);
  redirect(next as never);
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login?message=signed-out');
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = zodEmail(value(formData, 'email'));
  if (parsed) {
    const config = getAuthConfig();
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed, {
      redirectTo: `${config.APP_URL}/auth/callback?next=/reset-password`,
    });
  }
  redirect('/forgot-password?message=reset-sent');
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = passwordResetSchema.safeParse({
    password: value(formData, 'password'),
    confirmPassword: value(formData, 'confirmPassword'),
  });
  if (!parsed.success) redirect('/reset-password?error=invalid');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) redirect('/reset-password?error=generic');
  redirect('/login?message=password-updated');
}

function zodEmail(input: string) {
  const result = credentialsSchema.shape.email.safeParse(input);
  return result.success ? result.data : null;
}
