'use server';

import { redirect } from 'next/navigation';
import { createApplicationDraft, submitApplication, updateApplicationDraft, uploadApplicationDocument } from './service';

function value(formData: FormData, name: string) {
  const input = formData.get(name);
  return typeof input === 'string' ? input : '';
}

function applicationInput(formData: FormData) {
  return {
    schoolName: value(formData, 'schoolName'),
    legalName: value(formData, 'legalName'),
    registrationNumber: value(formData, 'registrationNumber'),
    schoolType: value(formData, 'schoolType'),
    email: value(formData, 'email'),
    phone: value(formData, 'phone'),
    website: value(formData, 'website'),
    addressLine1: value(formData, 'addressLine1'),
    addressLine2: value(formData, 'addressLine2'),
    city: value(formData, 'city'),
    stateOrRegion: value(formData, 'stateOrRegion'),
    postalCode: value(formData, 'postalCode'),
    countryCode: value(formData, 'countryCode'),
    principalName: value(formData, 'principalName'),
  };
}

export async function createApplicationDraftAction(formData: FormData) {
  let application;
  try {
    application = await createApplicationDraft(applicationInput(formData));
  } catch {
    redirect('/onboarding?error=invalid');
  }
  redirect(`/onboarding/${application.id}?message=draft-saved` as never);
}

export async function updateApplicationDraftAction(formData: FormData) {
  const applicationId = value(formData, 'applicationId');
  try {
    await updateApplicationDraft(applicationId, applicationInput(formData));
  } catch {
    redirect(`/onboarding/${applicationId}?error=invalid` as never);
  }
  redirect(`/onboarding/${applicationId}?message=draft-saved` as never);
}

export async function submitApplicationAction(formData: FormData) {
  const applicationId = value(formData, 'applicationId');
  try {
    await submitApplication(applicationId);
  } catch {
    redirect(`/onboarding/${applicationId}?error=not-submitted` as never);
  }
  redirect(`/onboarding/${applicationId}?message=submitted` as never);
}

export async function uploadApplicationDocumentAction(formData: FormData) {
  const applicationId = value(formData, 'applicationId');
  const documentType = value(formData, 'documentType');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/onboarding/${applicationId}?error=invalid-file` as never);
  }
  try {
    await uploadApplicationDocument({
      applicationId,
      file,
      metadata: {
        documentType,
        originalFileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });
  } catch {
    redirect(`/onboarding/${applicationId}?error=invalid-file` as never);
  }
  redirect(`/onboarding/${applicationId}?message=document-uploaded` as never);
}
