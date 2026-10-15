import { ApiError } from "./api-errors";
import { getSecurityDeps } from "./security-deps";

export interface VerifiedUser {
  uid: string;
}

export type IdTokenVerifier = (token: string) => Promise<VerifiedUser>;

const MAX_TOKEN_LENGTH = 4096;

export function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!m) return null;
  const token = m[1];
  if (token.length > MAX_TOKEN_LENGTH || token.split(".").length !== 3) return null;
  return token;
}

function isInfrastructureError(error: unknown): boolean {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return code === "auth/internal-error" || code === "app/network-error" || code === "app/invalid-credential";
}

/**
 * Identity comes only from a verified Firebase ID token — never from
 * client-supplied user IDs. Throws ApiError(401) when missing or invalid.
 */
export async function authenticateRequest(request: Request): Promise<VerifiedUser> {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    throw new ApiError(401, "ERR_UNAUTHENTICATED", "Sign in to continue.");
  }
  try {
    const user = await getSecurityDeps().verifyIdToken(token);
    if (!user?.uid) throw new Error("Verified token has no uid.");
    return user;
  } catch (error) {
    if (isInfrastructureError(error)) {
      console.error("[auth] token verification unavailable", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError(
        503,
        "ERR_AUTH_UNAVAILABLE",
        "Sign-in could not be checked right now. Please try again shortly.",
        { retryable: true },
      );
    }
    throw new ApiError(401, "ERR_INVALID_TOKEN", "Your session has expired. Sign in again to continue.");
  }
}
