import { NextResponse } from "next/server";

/** Error carrying an HTTP status for API route guards (auth, quota, URL policy). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly headers: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    opts: { retryable?: boolean; headers?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryable = opts.retryable ?? false;
    this.headers = opts.headers ?? {};
  }
}

export function apiErrorJson(error: ApiError): NextResponse {
  return NextResponse.json(
    { error: error.message, code: error.code, retryable: error.retryable },
    { status: error.status, headers: error.headers },
  );
}

/** Bounded provider-neutral fields for server logs; never serialize raw errors. */
export function safeErrorDetails(error: unknown): Record<string, unknown> {
  const value = error && typeof error === "object"
    ? (error as Record<string, unknown>)
    : null;
  const requestId = value?.requestID ?? value?.request_id;

  return {
    name: error instanceof Error ? error.name : "UnknownError",
    code: typeof value?.code === "string" ? value.code : undefined,
    status: typeof value?.status === "number" ? value.status : undefined,
    requestId: typeof requestId === "string" ? requestId : undefined,
  };
}
