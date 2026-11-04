import type { ApiErrorBody } from '@/types/api';

/** True when the app runs against the in-browser mock backend (VITE_USE_MOCKS=true). */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const API_BASE = '/api';

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

  /** Same error with field keys renamed, e.g. { first_name: 'firstName' }. */
  withFieldNames(names: Record<string, string>) {
    const fields = Object.fromEntries(
      Object.entries(this.fields).map(([key, msg]) => [names[key] ?? key, msg]),
    );
    return new ApiError(this.status, { code: this.code, message: this.message, fields });
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
  if (!res.ok) throw new ApiError(res.status, toErrorBody(res.status, data));
  return data as T;
}

const STATUS_CODES: Record<number, string> = {
  400: 'validation_error',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_error',
};

/**
 * Accepts every error shape the Flask app sends today, plus the one in
 * docs/api-contract.md, and turns them into one form the UI understands:
 *   { "error": { "code", "message", "fields" } }   contract
 *   { "errors": { "email": "..." } }               field validation (register, events)
 *   { "error": "Neautentificat" }                  plain message (login, auth guards)
 *   HTML 404 page                                  route not built on the server yet
 */
function toErrorBody(status: number, data: unknown): ApiErrorBody['error'] {
  const code = STATUS_CODES[status] ?? 'unknown_error';
  if (isRecord(data)) {
    const { error, errors } = data;
    if (isRecord(error) && typeof error.message === 'string') {
      return error as unknown as ApiErrorBody['error'];
    }
    if (isRecord(errors)) {
      const fields = Object.fromEntries(
        Object.entries(errors).filter((e): e is [string, string] => typeof e[1] === 'string'),
      );
      return { code, message: 'Check the highlighted fields.', fields };
    }
    if (typeof error === 'string') return { code, message: error };
  }
  if (status === 404) {
    return {
      code: 'not_available',
      message: 'This part of UniConnect is not available on the server yet.',
    };
  }
  return { code, message: 'Something went wrong. Try again in a moment.' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
