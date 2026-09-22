'use client';

import { useFormStatus } from 'react-dom';

export function AuthSubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button className='button form-button' type='submit' disabled={pending} aria-disabled={pending} aria-live='polite'>{pending ? <><span className='button-spinner' aria-hidden='true' />{pendingLabel}</> : <>{idleLabel} <span aria-hidden='true'>→</span></>}</button>;
}
