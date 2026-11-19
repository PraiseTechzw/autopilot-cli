export type ErrorCode =
  | "CONFIG_INVALID"
  | "CONFIG_READ_FAILED"
  | "CONFIG_VERSION_UNSUPPORTED"
  | "GIT_NOT_FOUND"
  | "GIT_COMMAND_FAILED"
  | "NOT_A_REPOSITORY"
  | "DOCTOR_FAILED"
  | "USAGE"
  | "INTERNAL";

export interface ErrorDetails {
  readonly [key: string]: unknown;
}

export interface AppErrorOptions {
  readonly exitCode?: number;
  readonly details?: ErrorDetails;
  readonly cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly exitCode: number;
  readonly details: ErrorDetails | undefined;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "AppError";
    this.code = code;
    this.exitCode = options.exitCode ?? 1;
    this.details = options.details;
  }
}

export function toAppError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("INTERNAL", fallbackMessage, { cause: error });
}
