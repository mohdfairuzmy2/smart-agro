const BASE = 'https://api.data.gov.my';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { Accept: 'application/json', ...init?.headers } });
  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}: ${url}`, res.status);
  }
  const data = (await res.json()) as T;
  if (data && typeof data === 'object' && 'status_code' in data && (data as { status_code: number }).status_code >= 400) {
    throw new ApiError((data as { details?: string[] }).details?.join(', ') ?? 'API error');
  }
  return data;
}

export function dataGovMy(path: string, params?: Record<string, string | number>): string {
  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  return url.toString();
}
