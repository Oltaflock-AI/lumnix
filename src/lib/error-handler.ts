import { NextResponse } from 'next/server';

interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
}

const ERROR_CODES: Record<string, ApiError> = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Authentication required', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: 'Access denied', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Invalid request', status: 400 },
  RATE_LIMITED: { code: 'RATE_LIMITED', message: 'Too many requests', status: 429 },
  PLAN_LIMIT: { code: 'PLAN_LIMIT', message: 'Plan limit reached', status: 403 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', status: 503 },
};

export function apiError(
  code: keyof typeof ERROR_CODES,
  details?: string | Record<string, any>
): NextResponse {
  const err = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
  return NextResponse.json(
    {
      error: {
        code: err.code,
        message: typeof details === 'string' ? details : err.message,
        ...(typeof details === 'object' ? { details } : {}),
      },
    },
    { status: err.status }
  );
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Error) {
    console.error(`[API Error] ${error.message}`, error.stack);
    return apiError('INTERNAL_ERROR', error.message);
  }
  console.error('[API Error] Unknown error', error);
  return apiError('INTERNAL_ERROR');
}
