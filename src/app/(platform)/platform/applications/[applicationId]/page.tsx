import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PlatformChrome } from '@/components/platform';
import {
  approveApplicationAction,
  downloadApplicationDocumentAction,
  markApplicationUnderReviewAction,
  rejectApplicationAction,
  requestApplicationChangesAction,
} from '@/server/platform/actions';
import { getPlatformApplication } from '@/server/platform/service';

export default async function PlatformApplicationDetailPage({
  params,
}: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  let result;
  try { result = await getPlatformApplication(applicationId); } catch { notFound(); }
  if (!result) notFound();
  const { application } = result;
  return (
    <PlatformChrome active='applications'>
      <p><Link href={'/platform/applications' as never}>← Applications</Link></p>
      <h1>{application.schoolName}</h1>
      <p>Status: <strong>{application.status}</strong></p>
      <p>Applicant: {application.applicant.firstName} {application.applicant.lastName} ({application.applicant.email})</p>
      <dl>
        <dt>School type</dt><dd>{application.schoolType}</dd>
        <dt>Contact</dt><dd>{application.email} · {application.phone}</dd>
        <dt>Address</dt><dd>{application.addressLine1}, {application.city}, {application.stateOrRegion}, {application.countryCode}</dd>
        <dt>Principal</dt><dd>{application.principalName ?? '—'}</dd>
      </dl>
      <section>
        <h2>Documents</h2>
        <ul>{application.documents.map(document => <li key={document.id}>
          {document.originalFileName} ({document.documentType}, {document.mimeType}, {document.sizeBytes} bytes)
          <form action={downloadApplicationDocumentAction}>
            <input type='hidden' name='applicationId' value={application.id} />
            <input type='hidden' name='documentId' value={document.id} />
            <button type='submit'>Open signed download</button>
          </form>
        </li>)}</ul>
      </section>
      <section>
        <h2>Review</h2>
        <form action={markApplicationUnderReviewAction}><input type='hidden' name='applicationId' value={application.id} /><button type='submit'>Mark under review</button></form>
        <form action={requestApplicationChangesAction}><input type='hidden' name='applicationId' value={application.id} /><textarea name='reviewNotes' placeholder='Required change notes' required /><button type='submit'>Request changes</button></form>
        <form action={rejectApplicationAction}><input type='hidden' name='applicationId' value={application.id} /><textarea name='rejectionReason' placeholder='Required rejection reason' required /><button type='submit'>Reject</button></form>
        <form action={approveApplicationAction}><input type='hidden' name='applicationId' value={application.id} /><button type='submit'>Approve and provision school</button></form>
      </section>
    </PlatformChrome>
  );
}
