import 'server-only';

export type ApplicationErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE_ERROR'
  | 'RATE_LIMITED';

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
    public readonly status = 500,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = code;
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication is required.') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message = 'You are not allowed to perform this action.') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message = 'The submitted data is invalid.') {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = 'The requested resource was not found.') {
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message = 'The request conflicts with existing data.') {
    super('CONFLICT', message, 409);
  }
}

export class BusinessRuleError extends ApplicationError {
  constructor(message = 'This operation is not allowed by the current business rules.') {
    super('BUSINESS_RULE_ERROR', message, 422);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message = 'Too many requests. Please try again later.') {
    super('RATE_LIMITED', message, 429);
  }
}

export type SafeErrorResponse = {
  ok: false;
  error: { code: ApplicationErrorCode | 'INTERNAL_ERROR'; message: string };
};

export function toSafeErrorResponse(error: unknown): SafeErrorResponse {
  if (error instanceof ApplicationError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }

  return {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  };
}

export function toSafeActionResult(error: unknown) {
  return toSafeErrorResponse(error);
}
