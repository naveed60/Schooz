export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = '/'
) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  try {
    const url = new URL(value, 'http://schooz.local');
    if (url.origin !== 'http://schooz.local' || url.pathname.includes('\\')) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
