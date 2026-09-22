'use server';

import { redirect } from 'next/navigation';
import { createPlatformApplicationDocumentDownloadUrl, approveApplication, markApplicationUnderReview, rejectApplication, requestApplicationChanges, setSchoolSuspended } from './service';

function value(formData: FormData, name: string) {
  const input = formData.get(name);
  return typeof input === 'string' ? input : '';
}

function safeErrorRedirect(path: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=action-failed` as never);
}

export async function markApplicationUnderReviewAction(formData: FormData) {
  const id = value(formData, 'applicationId');
  try { await markApplicationUnderReview(id); } catch { safeErrorRedirect(`/platform/applications/${id}`); }
  redirect(`/platform/applications/${id}?message=under-review` as never);
}

export async function requestApplicationChangesAction(formData: FormData) {
  const id = value(formData, 'applicationId');
  try { await requestApplicationChanges(id, value(formData, 'reviewNotes')); } catch { safeErrorRedirect(`/platform/applications/${id}`); }
  redirect(`/platform/applications/${id}?message=changes-requested` as never);
}

export async function rejectApplicationAction(formData: FormData) {
  const id = value(formData, 'applicationId');
  try { await rejectApplication(id, value(formData, 'rejectionReason')); } catch { safeErrorRedirect(`/platform/applications/${id}`); }
  redirect(`/platform/applications/${id}?message=rejected` as never);
}

export async function approveApplicationAction(formData: FormData) {
  const id = value(formData, 'applicationId');
  try { await approveApplication(id); } catch { safeErrorRedirect(`/platform/applications/${id}`); }
  redirect(`/platform/applications/${id}?message=approved` as never);
}

export async function downloadApplicationDocumentAction(formData: FormData) {
  const applicationId = value(formData, 'applicationId');
  const documentId = value(formData, 'documentId');
  let url: string;
  try {
    url = await createPlatformApplicationDocumentDownloadUrl({ applicationId, documentId });
  } catch {
    safeErrorRedirect(`/platform/applications/${applicationId}`);
  }
  redirect(url! as never);
}

export async function suspendSchoolAction(formData: FormData) {
  const id = value(formData, 'schoolId');
  try { await setSchoolSuspended(id, true); } catch { safeErrorRedirect(`/platform/schools/${id}`); }
  redirect(`/platform/schools/${id}?message=suspended` as never);
}

export async function reactivateSchoolAction(formData: FormData) {
  const id = value(formData, 'schoolId');
  try { await setSchoolSuspended(id, false); } catch { safeErrorRedirect(`/platform/schools/${id}`); }
  redirect(`/platform/schools/${id}?message=reactivated` as never);
}
