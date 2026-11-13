import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/public/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing use of the ArtPraxis private beta.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms"
      title="Terms of Use"
      intro="These terms set the ground rules for learning with ArtPraxis during the V1 private beta."
    >
      <section>
        <h2>Agreement and operator</h2>
        <p>
          By creating an account or using ArtPraxis, you agree to these Terms and the
          <Link href="/privacy"> Privacy Policy</Link>. ArtPraxis is operated by Lauren White
          in California, USA. If you do not agree, do not use the service.
        </p>
      </section>

      <section>
        <h2>Private-beta eligibility</h2>
        <p>
          You must be at least 18 years old and invited or otherwise authorized to use the V1
          private beta. Access is personal and may not be transferred. Keep your sign-in method
          secure and notify <a href="mailto:support@artpraxis.art">support@artpraxis.art</a> if
          you believe your account has been compromised.
        </p>
      </section>

      <section>
        <h2>Your reference images</h2>
        <p>
          You keep ownership of images you upload. You promise that you own them or have the
          rights and permission needed to use them, including permission from identifiable
          people where required. You grant ArtPraxis a limited license to store, resize,
          analyze, and transmit the images to service providers only as needed to create and
          maintain your lessons, secure the service, and provide support.
        </p>
        <p>
          Do not upload unlawful content, intimate imagery, exploitative content, confidential
          material you are not permitted to share, or content that infringes another person’s
          rights.
        </p>
      </section>

      <section>
        <h2>Generated lessons</h2>
        <p>
          ArtPraxis uses automated systems to analyze references and generate lesson text and
          demonstration images. Generated material may be incomplete, inaccurate, or visually
          different from your reference. Use your judgment and treat the lesson as educational
          guidance rather than a guarantee of a particular result.
        </p>
        <p>
          To the extent ArtPraxis has rights in lesson output generated specifically for you,
          ArtPraxis grants you permission to use that output for personal and commercial artwork.
          Outputs may not be unique, and these Terms do not give you rights in another person’s
          work, trademarks, likeness, or other protected material.
        </p>
      </section>

      <section>
        <h2>Acceptable use and limits</h2>
        <p>You may not:</p>
        <ul>
          <li>probe, bypass, or interfere with authentication, generation quotas, storage rules, or other safeguards;</li>
          <li>use automation to create accounts or generate lessons at a volume beyond the provided limits;</li>
          <li>attempt to access another learner’s account, images, or lessons;</li>
          <li>use ArtPraxis to violate law or another person’s rights; or</li>
          <li>resell access to the service or falsely imply endorsement by ArtPraxis.</li>
        </ul>
      </section>

      <section>
        <h2>Beta availability</h2>
        <p>
          The V1 private beta is provided without charge and may contain errors, change without
          notice, or be unavailable while limits, models, or teaching methods are adjusted.
          Access may be suspended to protect learners, control costs, investigate abuse, or
          maintain the service. Paid features, if introduced, will be covered by updated terms
          presented before purchase.
        </p>
      </section>

      <section>
        <h2>Disclaimers and responsibility</h2>
        <p>
          ArtPraxis is provided “as is” and “as available” to the extent permitted by law.
          ArtPraxis does not guarantee uninterrupted availability, exact color reproduction,
          error-free generation, or a particular artistic outcome. You remain responsible for
          how you use uploaded material and generated output.
        </p>
      </section>

      <section>
        <h2>Ending access</h2>
        <p>
          You may stop using ArtPraxis and request deletion through <Link href="/support">Support</Link>.
          ArtPraxis may suspend or end access for material violations of these Terms, security
          risks, unlawful activity, or discontinuation of the beta.
        </p>
      </section>

      <section>
        <h2>Governing law and contact</h2>
        <p>
          These Terms are governed by the laws of California, without regard to conflict-of-law
          principles, except where applicable law requires otherwise. Questions may be sent to
          <a href="mailto:support@artpraxis.art"> support@artpraxis.art</a>.
        </p>
      </section>
    </LegalPageShell>
  );
}
