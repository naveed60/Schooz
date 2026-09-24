'use client';

import { useState, type FormEvent } from 'react';
import { uploadApplicationDocumentAction } from '@/server/onboarding/actions';

const maxFileSize = 10 * 1024 * 1024;
const supportedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

type UploadError = 'invalid-file' | 'upload-failed' | 'storage-unavailable' | null;

export function DocumentUploadForm({
  applicationId,
  serverError,
}: {
  applicationId: string;
  serverError: UploadError;
}) {
  const [clientError, setClientError] = useState<string | null>(null);
  const error = clientError ?? (serverError === 'invalid-file'
    ? 'Enter a document type and choose a supported file under 10 MB.'
    : serverError === 'storage-unavailable'
      ? 'Document uploads are unavailable. Please contact your administrator.'
      : serverError === 'upload-failed'
        ? 'We could not save the document. Please try the upload again.'
        : null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const documentType = String(formData.get('documentType') ?? '').trim();
    const file = formData.get('file');
    let nextError: string | null = null;
    if (documentType.length < 2 || documentType.length > 80) {
      nextError = 'Enter a document type between 2 and 80 characters.';
    } else if (!(file instanceof File) || file.size === 0) {
      nextError = 'Choose a file to upload.';
    } else if (file.size > maxFileSize) {
      nextError = 'The file must be smaller than 10 MB.';
    } else if (!supportedTypes.has(file.type)) {
      nextError = 'Choose a PDF, JPG, PNG, or WebP file.';
    }
    if (nextError) {
      event.preventDefault();
      setClientError(nextError);
    }
  }

  function clearError() {
    setClientError(null);
  }

  return (
    <form action={uploadApplicationDocumentAction} className='auth-form onboarding-document-form' noValidate onSubmit={handleSubmit}>
      <input type='hidden' name='applicationId' value={applicationId} />
      <label htmlFor='documentType'>Document type</label>
      <input id='documentType' name='documentType' placeholder='e.g. registration certificate' minLength={2} maxLength={80} onChange={clearError} required />
      <label htmlFor='file'>Choose a file</label>
      <input id='file' name='file' type='file' accept='.pdf,.jpg,.jpeg,.png,.webp' aria-invalid={Boolean(error)} aria-describedby={error ? 'upload-error' : undefined} onChange={clearError} required />
      {error && <p className='onboarding-field-error' id='upload-error' role='alert'>{error}</p>}
      <button className='button onboarding-detail-action' type='submit'>Upload document</button>
    </form>
  );
}
