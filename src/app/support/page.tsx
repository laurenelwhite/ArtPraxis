import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/public/LegalPageShell";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with an ArtPraxis account, lesson, or privacy request.",
};

export default function SupportPage() {
  return (
    <LegalPageShell
      eyebrow="Support"
      title="How can we help?"
      intro="Send a short description of what happened and we’ll help you return to your practice."
    >
      <section className="legal-contact-card">
        <h2>Email support</h2>
        <p>
          Write to <a href="mailto:support@artpraxis.art">support@artpraxis.art</a>. We aim to
          reply within three business days during the private beta.
        </p>
        <a className="btn-solid btn-branded legal-contact-button" href="mailto:support@artpraxis.art?subject=ArtPraxis%20support">
          Email ArtPraxis support
        </a>
      </section>

      <section>
        <h2>What to include</h2>
        <ul>
          <li>the email address used to sign in;</li>
          <li>the lesson title and what you were trying to do;</li>
          <li>the exact error message, if one appeared; and</li>
          <li>a screenshot with private or unrelated information removed.</li>
        </ul>
        <p>Never send your password, sign-in code, API key, payment information, or another learner’s content.</p>
      </section>

      <section>
        <h2>Account and privacy requests</h2>
        <p>
          To request access, correction, or deletion, email support from the address associated
          with your ArtPraxis account and use the subject “Privacy request.” We may ask for a
          reasonable step to verify account ownership. We aim to complete verified deletion
          requests within 30 days.
        </p>
        <p>
          Read the <Link href="/privacy">Privacy Policy</Link> for details about stored content
          and service providers.
        </p>
      </section>

      <section>
        <h2>Private-beta limits</h2>
        <p>
          Lesson generation is intentionally limited during the V1 beta. If you reach a daily
          limit, your saved lessons remain available; try creating a new lesson after the next
          daily reset. Limits protect the reliability and cost of the shared beta.
        </p>
      </section>
    </LegalPageShell>
  );
}
