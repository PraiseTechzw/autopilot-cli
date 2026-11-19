import type { AppError, ErrorDetails } from "./errors.js";

export const JSON_SCHEMA_VERSION = 1 as const;

export interface JsonSuccess<T> {
  readonly schemaVersion: typeof JSON_SCHEMA_VERSION;
  readonly ok: true;
  readonly command: string;
  readonly data: T;
}

export interface JsonFailure {
  readonly schemaVersion: typeof JSON_SCHEMA_VERSION;
  readonly ok: false;
  readonly command: string;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: ErrorDetails;
  };
}

export type JsonEnvelope<T> = JsonSuccess<T> | JsonFailure;

export function jsonSuccess<T>(command: string, data: T): JsonSuccess<T> {
  return {
    schemaVersion: JSON_SCHEMA_VERSION,
    ok: true,
    command,
    data,
  };
}

export function jsonFailure(
  command: string,
  error: AppError,
): JsonFailure {
  const payload: JsonFailure["error"] = {
    code: error.code,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
  };

  return {
    schemaVersion: JSON_SCHEMA_VERSION,
    ok: false,
    command,
    error: payload,
  };
}

export function serializeJson(envelope: JsonEnvelope<unknown>): string {
  return `${JSON.stringify(envelope)}\n`;
}

export function writeJson(envelope: JsonEnvelope<unknown>): void {
  process.stdout.write(serializeJson(envelope));
}

export function writeOut(message: string): void {
  process.stdout.write(`${message}\n`);
}

export function writeErr(message: string): void {
  process.stderr.write(`${message}\n`);
}
