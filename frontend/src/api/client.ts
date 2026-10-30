import type { ApiErrorBody } from '@/types/api';

/** True when the app runs against the in-browser mock backend (VITE_USE_MOCKS=true). */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(status: number, body: ApiErrorBody['error']) {
    super(body.message);
    this.status = status;
    this.code = body.code;
    this.fields = body.fields ?? {};
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  /** Plain objects are sent as JSON, FormData as multipart. */
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Single entry point for backend calls. Always a relative path (CLAUDE.md, rule 1):
 * Vite proxies /api in dev and Vercel routes it in production. The session lives in an
 * httpOnly cookie set by the backend, so there is no token handling here.
 */
export async function request<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
) {
  if (USE_MOCKS) {
    const { mockRequest } = await import('./mock/server');
    return mockRequest<T>(method, path, body);
  }

  const isForm = body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    signal,
    credentials: 'same-origin',
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = isApiErrorBody(data)
      ? data.error
      : { code: 'unknown_error', message: 'Something went wrong. Try again in a moment.' };
    throw new ApiError(res.status, error);
  }
  return data as T;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error?.message === 'string'
  );
}
