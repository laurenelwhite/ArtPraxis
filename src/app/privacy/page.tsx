import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/public/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ArtPraxis collects, uses, stores, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains what ArtPraxis needs in order to build your lessons, how that information is used, and the choices available to you."
    >
      <section>
        <h2>Who operates ArtPraxis</h2>
        <p>
          ArtPraxis is operated by Lauren White in California, USA. Questions and privacy
          requests can be sent to <a href="mailto:support@artpraxis.art">support@artpraxis.art</a>.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> your email address and, when you use Google sign-in, basic profile information provided by Google.</li>
          <li><strong>Lesson content:</strong> reference images you upload, selected medium and skill level, generated lessons and demonstration images, and your saved progress.</li>
          <li><strong>Support information:</strong> messages and attachments you choose to send when asking for help or making a privacy request.</li>
          <li><strong>Security and technical information:</strong> authentication records, request timing, error details, and limited device or browser information needed to operate and protect the service.</li>
          <li><strong>On-device preferences:</strong> ArtPraxis uses browser storage for lesson preferences and interface state. These items remain on your device until you clear them.</li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <p>We use information only as reasonably necessary to:</p>
        <ul>
          <li>create, save, and display your personalized painting lessons;</li>
          <li>authenticate your account and keep one learner’s projects separate from another’s;</li>
          <li>generate lesson text and teaching images from your chosen reference;</li>
          <li>answer support requests and carry out access or deletion requests;</li>
          <li>prevent abuse, enforce generation limits, diagnose errors, and maintain service security; and</li>
          <li>comply with applicable law.</li>
        </ul>
        <p>
          The V1 service does not sell personal information, use personal information for
          targeted advertising, or load third-party advertising trackers.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>
          ArtPraxis uses Google Firebase and Google Cloud for authentication, database,
          file storage, hosting, security, and operational logs. Reference images and related
          lesson instructions are sent to the OpenAI API to analyze the reference and create
          lesson material. OpenAI states that API inputs and outputs are not used to train its
          models by default unless the API customer opts in, and that eligible API content may
          be retained for a limited period for service operation and abuse monitoring.
        </p>
        <p>
          These providers process information under their own terms and privacy commitments.
          ArtPraxis does not give them permission to use your content for advertising.
        </p>
      </section>

      <section>
        <h2>Retention and deletion</h2>
        <p>
          Account details, uploaded references, generated lessons, and progress are retained
          while your account is active so you can return to your practice. You may request
          deletion at any time by emailing <a href="mailto:support@artpraxis.art?subject=ArtPraxis%20deletion%20request">support@artpraxis.art</a>{" "}
          from the address associated with your account. We aim to complete verified requests
          within 30 days.
        </p>
        <p>
          Limited information may be retained longer when required for fraud prevention,
          security, legal obligations, or backup integrity. Information retained for those
          purposes is not used to provide new lessons.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You may request access to, correction of, or deletion of your account information
          by contacting support. California residents may also ask what categories of personal
          information ArtPraxis has collected and how they were used. ArtPraxis does not sell
          or share personal information for cross-context behavioral advertising.
        </p>
      </section>

      <section>
        <h2>Age requirement</h2>
        <p>
          ArtPraxis V1 is intended only for people who are at least 18 years old. Do not create
          an account or upload images if you are under 18.
        </p>
      </section>

      <section>
        <h2>Security and changes</h2>
        <p>
          ArtPraxis uses access controls, private per-user storage paths, encrypted provider
          connections, and server-side generation limits. No online service can promise perfect
          security. If this policy changes materially, the effective date will be updated and
          a prominent notice will be provided where appropriate.
        </p>
        <p>For account help, see <Link href="/support">Support</Link>.</p>
      </section>
    </LegalPageShell>
  );
}
