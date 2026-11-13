import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_READY_TIMEOUT_MS,
  initialAuthUiState,
  reduceAuthLoadingEvent,
} from "../src/lib/auth-loading.ts";

describe("auth loading recovery", () => {
  it("starts in a checking/loading state", () => {
    const state = initialAuthUiState();
    assert.equal(state.loading, true);
    assert.equal(state.user, null);
    assert.equal(state.error, null);
  });

  it("clears loading when auth resolves as signed out", () => {
    const next = reduceAuthLoadingEvent(initialAuthUiState(), {
      type: "resolved",
      user: null,
    });
    assert.equal(next.loading, false);
    assert.equal(next.user, null);
    assert.equal(next.error, null);
  });

  it("surfaces listener errors without staying loading", () => {
    const next = reduceAuthLoadingEvent(initialAuthUiState(), {
      type: "listener_error",
      message: "network-request-failed",
    });
    assert.equal(next.loading, false);
    assert.equal(next.user, null);
    assert.equal(next.error, "network-request-failed");
  });

  it("timeout recovers from an indefinite checking state", () => {
    assert.ok(AUTH_READY_TIMEOUT_MS >= 1000);
    const next = reduceAuthLoadingEvent(initialAuthUiState(), {
      type: "timeout",
      currentUser: null,
    });
    assert.equal(next.loading, false);
    assert.equal(next.user, null);
    assert.match(next.error ?? "", /took too long/i);
  });

  it("timeout does not overwrite an already-resolved session", () => {
    const resolved = reduceAuthLoadingEvent(initialAuthUiState(), {
      type: "resolved",
      user: null,
    });
    const afterTimeout = reduceAuthLoadingEvent(resolved, {
      type: "timeout",
      currentUser: null,
    });
    assert.deepEqual(afterTimeout, resolved);
  });
});
