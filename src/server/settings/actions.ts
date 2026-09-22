'use server';

import { redirect } from 'next/navigation';
import { contextForSchoolSlug, updateSchoolSettings, uploadSchoolLogo } from './service';

function value(formData: FormData, name: string) {
  const input = formData.get(name);
  return typeof input === 'string' ? input : '';
}

function fail(schoolSlug: string): never {
  redirect(`/s/${schoolSlug}/settings?error=update-failed` as never);
}

export async function updateSchoolSettingsAction(formData: FormData) {
  const schoolSlug = value(formData, 'schoolSlug');
  try {
    const context = await contextForSchoolSlug(schoolSlug);
    await updateSchoolSettings(context, {
      timezone: value(formData, 'timezone'),
      currencyCode: value(formData, 'currencyCode'),
      dateFormat: value(formData, 'dateFormat'),
      studentNumberPrefix: value(formData, 'studentNumberPrefix'),
      invoiceNumberPrefix: value(formData, 'invoiceNumberPrefix'),
    });
  } catch {
    fail(schoolSlug);
  }
  redirect(`/s/${schoolSlug}/settings?message=updated` as never);
}

export async function uploadSchoolLogoAction(formData: FormData) {
  const schoolSlug = value(formData, 'schoolSlug');
  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) fail(schoolSlug);
  try {
    const context = await contextForSchoolSlug(schoolSlug);
    await uploadSchoolLogo({ context, file, metadata: { originalName: file.name, contentType: file.type, sizeBytes: file.size } });
  } catch {
    fail(schoolSlug);
  }
  redirect(`/s/${schoolSlug}/settings?message=logo-updated` as never);
}
