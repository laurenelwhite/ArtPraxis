# ArtPraxis V1 production handoff

This branch is build-ready but its checked-in `apphosting.yaml` is intentionally
staging-only. It must not be used as the production configuration.

## Production configuration

1. Use `apphosting.production.example.yaml` as the reviewed production
   configuration for the five-person private beta. It already contains the
   public Firebase web-app identifiers and the `https://artpraxis.art` site URL.
   Do not copy values from the staging configuration over it.
2. Create the OpenAI secret with Firebase App Hosting secret management and
   grant the production backend access. The secret remains runtime-only.
3. Keep the approved private-beta limits unless the owner explicitly changes
   them: two lessons per user per day, three generated images per user per day,
   and one concurrent generation per user.
4. Keep the approved model allowlist aligned with the OpenAI project:
   `gpt-5-mini`, `gpt-4o-mini`, and `gpt-image-1.5`. Dated model snapshots remain
   blocked. Per-stage AI refinement remains disabled for V1.
5. Confirm the OpenAI project hard limit and alerts are still active before the
   first rollout. The approved hard limit is $25 per month.
6. Run `npm run validate:production -- apphosting.production.example.yaml`.
   The rollout must stop if this check reports placeholders, staging values,
   a missing runtime secret, a missing HTTPS site URL, or disabled tutorial
   and concurrency quotas.

Firebase App Hosting supports environment-specific YAML files and Cloud Secret
Manager references. Console values take precedence over checked-in YAML, so
review the rollout’s resolved environment list before directing production
traffic.

## Domain and authentication

- Do not connect `artpraxis.art` to GoDaddy Airo or replace its website DNS
  records. GoDaddy may manage Microsoft 365 email records only.
- Finish the `support@artpraxis.art` mailbox migration before launch and test
  both incoming and outgoing mail. This is currently an owner action pending
  GoDaddy support.
- Connect the final custom domain to the production App Hosting backend.
- Wait for the domain to report connected with a valid SSL certificate.
- Add the production domain to Firebase Authentication authorized domains.
- Review and personalize the Google OAuth consent screen before launch.

## Current owner-gated launch steps

These require account-holder action and must not be inferred as complete from a
successful local build:

1. Complete the GoDaddy Microsoft 365 migration for `support@artpraxis.art`.
2. Upgrade the production Firebase project from Spark to Blaze only when the
   owner is ready to create the App Hosting backend and has reviewed billing.
3. Create the OpenAI production API key inside the restricted ArtPraxis
   Production project and store it directly in Firebase Secret Manager. Never
   paste the key into source code, chat, screenshots, or a public environment
   variable.
4. Create the production App Hosting backend and perform the required smoke
   test before directing the public domain to it.
5. Keep access invitation-only for the five-person beta.

## Required smoke test

Run this sequence on the deployed production backend with a new test account:

1. Open the landing page on desktop and mobile.
2. Create an account, sign out, and sign back in.
3. Upload a reference smaller than 10 MB.
4. Create a watercolor lesson and wait for the lesson shell.
5. Confirm the reference, finished study, materials, lesson stages, and progress
   views reopen after a hard refresh.
6. Confirm another account cannot read the first account’s lesson or images.
7. Confirm quota errors are understandable and do not consume a saved lesson.
8. Confirm the support and data-deletion routes in the published policies.

## Rollback

- Keep the previous known-good rollout available in App Hosting.
- If lesson creation fails, restore the prior rollout before changing quotas or
  secrets in place.
- Never make the OpenAI key public or place it in a `NEXT_PUBLIC_` variable.

## Operations before opening access

- Keep V1 access constrained until a global spend ceiling is in place. Per-user
  quotas do not stop one person from creating multiple accounts.
- Set OpenAI project spend alerts and a hard budget limit before inviting users.
- Set alerts for App Hosting 5xx responses and latency, authentication failures,
  and quota-store failures. Assign one person to receive and act on each alert.
- Decide and record the Firestore/Storage backup or point-in-time recovery plan.
- Record the owner and steps for rollback, OpenAI secret rotation, and Firebase
  credential rotation.
- Run a synthetic post-deploy check that opens the home page, signs in with a
  test account, creates one lesson within quota, and reopens it after refresh.
- Do not expose account deletion until recursive cleanup covers the Auth user,
  project document, nested lesson documents, and Storage objects.

## Known launch gates

- Privacy, Terms, and Support pages are implemented with Lauren White as the
  operator, California jurisdiction, an 18+ private beta, and the ArtPraxis
  support address. Confirm the mailbox works and obtain legal review before a
  broad commercial launch.
- Keep public signup limited while quotas are only per account.
- Track the remaining dependency advisories as regression-tested major upgrades;
  do not apply automated breaking upgrades to the launch branch.
