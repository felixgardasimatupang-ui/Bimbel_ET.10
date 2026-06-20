export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

function isLocalhostApiUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getApiBase(): string {
  const rawApiUrl = import.meta.env.VITE_API_URL || '';

  if (!rawApiUrl || (import.meta.env.PROD && isLocalhostApiUrl(rawApiUrl))) {
    return '/api';
  }

  return rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
}
