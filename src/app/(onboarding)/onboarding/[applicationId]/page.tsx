import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  submitApplicationAction,
  updateApplicationDraftAction,
} from '@/server/onboarding/actions';
import { canApplicantEdit } from '@/server/onboarding/state';
import { getMyApplication } from '@/server/onboarding/service';
import { DocumentUploadForm } from '@/components/onboarding/document-upload-form';

const fields = [
  { name: 'schoolName', label: 'School name', required: true },
  { name: 'legalName', label: 'Legal name' },
  { name: 'registrationNumber', label: 'Registration number' },
  { name: 'schoolType', label: 'School type', required: true },
  { name: 'email', label: 'School email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'website', label: 'Website', type: 'url' },
  { name: 'addressLine1', label: 'Address line 1', required: true },
  { name: 'addressLine2', label: 'Address line 2' },
  { name: 'city', label: 'City', required: true },
  { name: 'stateOrRegion', label: 'State or region', required: true },
  { name: 'postalCode', label: 'Postal code' },
  { name: 'countryCode', label: 'Country code', maxLength: 2, required: true },
  { name: 'principalName', label: 'Principal name' },
] as const;

const errors = {
  invalid: 'The application details could not be saved. Check the fields below.',
  'invalid-file': 'The document could not be uploaded. Check the file and document type below.',
  'upload-failed': 'The document upload failed. Please try again.',
  'storage-unavailable': 'Document uploads are unavailable. Please contact your administrator.',
  'not-submitted': 'The application could not be submitted. Check the requirements below.',
} as const;

const messages = {
  'draft-saved': 'Your application draft was saved.',
  'document-uploaded': 'The verification document was uploaded.',
  submitted: 'Your application was submitted for review.',
} as const;

export default async function OnboardingApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { applicationId } = await params;
  const feedback = await searchParams;
  let application;
  try {
    application = await getMyApplication(applicationId);
  } catch {
    notFound();
  }
  if (!application) notFound();
  const editable = canApplicantEdit(application.status);
  const error = feedback.error && errors[feedback.error as keyof typeof errors];
  const message = feedback.message && messages[feedback.message as keyof typeof messages];

  return (
    <main className='onboarding-page'>
      <div className='onboarding-wrap'>
        <nav className='onboarding-nav'>
          <Link className='brand' href='/'><span className='brand-mark'>S</span><span>Schooz</span></Link>
          <Link className='onboarding-exit' href='/onboarding'>All applications <span>↗</span></Link>
        </nav>
        <header className='onboarding-header'>
          <div>
            <p className='eyebrow'>School application</p>
            <h1>{application.schoolName}</h1>
            <p className='onboarding-lede'>Status: <strong>{application.status.replaceAll('_', ' ')}</strong></p>
          </div>
        </header>
        {error && <p className='form-error onboarding-feedback' role='alert'>{error}</p>}
        {message && <p className='form-message onboarding-feedback' role='status'>{message}</p>}
        {application.reviewNotes && <p className='onboarding-feedback'>Reviewer notes: {application.reviewNotes}</p>}
        {application.rejectionReason && <p className='onboarding-feedback'>Reason: {application.rejectionReason}</p>}

        {editable && (
          <>
            <section className='onboarding-section' id='application-details'>
              <h2>{application.status === 'CHANGES_REQUESTED' ? 'Update application' : 'Application details'}</h2>
              <form action={updateApplicationDraftAction} className='auth-form onboarding-form'>
                <input type='hidden' name='applicationId' value={application.id} />
                <div className='onboarding-detail-fields'>
                  {fields.map(field => (
                    <label className='onboarding-detail-field' htmlFor={field.name} key={field.name}>
                      <span>{field.label}</span>
                      <input
                        id={field.name}
                        name={field.name}
                        type={'type' in field ? field.type : 'text'}
                        defaultValue={String(application[field.name] ?? '')}
                        maxLength={'maxLength' in field ? field.maxLength : undefined}
                        required={'required' in field ? field.required : false}
                      />
                    </label>
                  ))}
                </div>
                {feedback.error === 'invalid' && <p className='onboarding-field-error'>Check required fields, email, phone, website, and the two-letter country code.</p>}
                <button className='button onboarding-detail-action' type='submit'>Save draft</button>
              </form>
            </section>

            <section className='onboarding-section' id='verification-documents'>
              <h2>Verification documents</h2>
              <p>Upload a PDF, JPG, PNG, or WebP file up to 10 MB.</p>
              <DocumentUploadForm
                applicationId={application.id}
                serverError={feedback.error === 'invalid-file' || feedback.error === 'upload-failed' || feedback.error === 'storage-unavailable' ? feedback.error : null}
              />
            </section>

            <section className='onboarding-section' id='submit-application'>
              <h2>Submit application</h2>
              <p>At least one verification document is required before submission.</p>
              <form action={submitApplicationAction}>
                <input type='hidden' name='applicationId' value={application.id} />
                {feedback.error === 'not-submitted' && <p className='onboarding-field-error'>Upload a verification document and try again. If you already uploaded one, refresh the page and retry.</p>}
                <button className='button onboarding-detail-action' type='submit'>Submit application</button>
              </form>
            </section>
          </>
        )}

        <section className='onboarding-section'>
          <h2>Uploaded documents</h2>
          {application.documents.length === 0 ? <p>No documents uploaded.</p> : (
            <ul className='onboarding-document-list'>
              {application.documents.map(document => <li key={document.id}>{document.originalFileName} ({document.documentType})</li>)}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
