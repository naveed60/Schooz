import { notFound } from 'next/navigation';
import {
  submitApplicationAction,
  updateApplicationDraftAction,
  uploadApplicationDocumentAction,
} from '@/server/onboarding/actions';
import { canApplicantEdit } from '@/server/onboarding/state';
import { getMyApplication } from '@/server/onboarding/service';

export default async function OnboardingApplicationPage({
  params,
}: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  let application;
  try {
    application = await getMyApplication(applicationId);
  } catch {
    notFound();
  }
  if (!application) notFound();
  const editable = canApplicantEdit(application.status);

  return (
    <main className='shell'>
      <p className='eyebrow'>School application</p>
      <h1>{application.schoolName}</h1>
      <p>Status: <strong>{application.status}</strong></p>
      {application.reviewNotes && <p>Reviewer notes: {application.reviewNotes}</p>}
      {application.rejectionReason && <p>Reason: {application.rejectionReason}</p>}

      {editable && (
        <>
          <h2>{application.status === 'CHANGES_REQUESTED' ? 'Update application' : 'Application details'}</h2>
          <form action={updateApplicationDraftAction} className='auth-form'>
            <input type='hidden' name='applicationId' value={application.id} />
            {(['schoolName', 'legalName', 'registrationNumber', 'schoolType', 'email', 'phone', 'website', 'addressLine1', 'addressLine2', 'city', 'stateOrRegion', 'postalCode', 'countryCode', 'principalName'] as const).map(field => (
              <input key={field} name={field} defaultValue={field in application ? String(application[field] ?? '') : ''} placeholder={field} required={['schoolName', 'schoolType', 'email', 'phone', 'addressLine1', 'city', 'stateOrRegion', 'countryCode'].includes(field)} />
            ))}
            <button type='submit'>Save draft</button>
          </form>

          <h2>Verification documents</h2>
          <form action={uploadApplicationDocumentAction} className='auth-form' encType='multipart/form-data'>
            <input type='hidden' name='applicationId' value={application.id} />
            <input name='documentType' placeholder='Document type' required />
            <input name='file' type='file' accept='.pdf,.jpg,.jpeg,.png,.webp' required />
            <button type='submit'>Upload document</button>
          </form>

          <form action={submitApplicationAction}>
            <input type='hidden' name='applicationId' value={application.id} />
            <button type='submit'>Submit application</button>
          </form>
        </>
      )}

      <h2>Uploaded documents</h2>
      {application.documents.length === 0 ? <p>No documents uploaded.</p> : <ul>{application.documents.map(document => <li key={document.id}>{document.originalFileName} ({document.documentType})</li>)}</ul>}
    </main>
  );
}
