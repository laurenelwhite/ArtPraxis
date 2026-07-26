import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authErrorMessage } from "../src/lib/auth-errors.ts";

describe("auth error messages", () => {
  it("explains common popup recovery actions without exposing Firebase internals", () => {
    assert.match(
      authErrorMessage({ code: "auth/popup-blocked" }),
      /allow pop-ups/i,
    );
    assert.match(
      authErrorMessage({ code: "auth/popup-closed-by-user" }),
      /closed/i,
    );
    assert.match(
      authErrorMessage({ code: "auth/network-request-failed" }),
      /connection/i,
    );
  });

  it("explains disabled or unauthorized Google sign-in", () => {
    assert.match(
      authErrorMessage({ code: "auth/operation-not-allowed" }),
      /not enabled/i,
    );
    assert.match(
      authErrorMessage({ code: "auth/unauthorized-domain" }),
      /not enabled for this site/i,
    );
  });

  it("uses a safe generic message for unknown values", () => {
    const message = authErrorMessage(new Error("secret backend detail"));
    assert.doesNotMatch(message, /secret backend detail/);
    assert.match(message, /authentication failed/i);
  });
});
