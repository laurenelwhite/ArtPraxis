export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : null;

  switch (code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups and try again.";
    case "auth/cancelled-popup-request":
      return "Another sign-in window is already open.";
    case "auth/unauthorized-domain":
      return "This address is not authorized for Google sign-in. Use http://localhost:3000 (not 127.0.0.1), or add the domain in Firebase Auth → Settings → Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Please use email and password for now.";
    case "auth/network-request-failed":
      return "Google sign-in could not reach the network. Check your connection and try again.";
    case "auth/argument-error":
      return "Google sign-in could not start. Please refresh the page and try again.";
    default:
      return "Authentication failed. Please check your details and try again.";
  }
}
