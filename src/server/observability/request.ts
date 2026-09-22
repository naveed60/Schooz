import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'x-request-id';

export function getRequestId(headers?: Headers | Record<string, string | undefined>) {
  const incoming = headers instanceof Headers
    ? headers.get(REQUEST_ID_HEADER)
    : headers?.[REQUEST_ID_HEADER];
  return incoming && /^[a-zA-Z0-9._:-]{1,120}$/.test(incoming)
    ? incoming
    : randomUUID();
}

export function requestIdHeader(requestId: string) {
  return { [REQUEST_ID_HEADER]: requestId };
}
