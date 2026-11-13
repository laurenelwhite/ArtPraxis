import Link from "next/link";
import { HomeGate } from "@/components/HomeGate";
import { Icon } from "@/components/Icon";
import { LandingMasthead } from "@/components/LandingMasthead";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";
import { AppImage } from "@/components/ui/AppImage";
import { inspirationGallery } from "@/lib/inspiration";
import { Term } from "@/components/vocabulary/Term";

// Demonstrates the product: one reference resolving through the six stages.
const demoStages = [
  { label: "Place the shape", src: "/images/lesson-demo/01-place-the-shape.webp" },
  { label: "Group the values", src: "/images/lesson-demo/02-group-the-values.webp" },
  { label: "Lay the first wash", src: "/images/lesson-demo/03-lay-first-wash.webp" },
  { label: "Build the form", src: "/images/lesson-demo/04-build-the-form.webp" },
  { label: "Deepen and refine", src: "/images/lesson-demo/05-deepen-and-refine.webp" },
  { label: "Add final accents", src: "/images/lesson-demo/06-add-final-accents.webp" },
];
const demoReference = "/images/inspiration/artpraxis-demo.webp";

export default function Home() {
  return (
    <HomeGate>
    <main className="site">

      <LandingMasthead />

      <section className="home-hero" id="main-content" tabIndex={-1}>
        <div className="home-hero-brand" aria-hidden="true">
          <ArtPraxisLogo variant="primary" size="primary" decorative />
        </div>
        <p className="eyebrow">A personalized painting lesson</p>
        <h1 className="display">Paint what you see, one deliberate stage at a time.</h1>
        <p className="home-lede">
          <em>Praxis</em> means putting knowledge into practice. Upload any reference and
          ArtPraxis builds a guided lesson in observation, <Term id="value">value</Term>,
          color, edges, and finish — so each painting teaches you how to make the next one stronger.
        </p>
        <div className="home-cta">
          <Link className="btn-solid btn-lg btn-branded" href="/studio/new">
            <Icon name="sparkles" size={18} />Create a lesson
          </Link>
          <Link className="btn-ghost" href="#how">See how it works</Link>
        </div>
      </section>

      <figure className="home-demo" id="how">
        <div className="home-demo-hero">
          <AppImage
            src={demoReference}
            alt="Reference photo being turned into a guided atelier lesson"
            width={900}
            height={506}
            sizes="(max-width: 900px) 100vw, 900px"
            priority
          />
          <figcaption>One reference. Six cumulative decisions — from first lines to final accents.</figcaption>
        </div>
        <ol className="home-demo-strip" aria-label="The six stages">
          {demoStages.map((s, i) => (
            <li key={s.label}>
              <span className="home-demo-thumb">
                <AppImage
                  src={s.src}
                  alt={`${s.label} stage`}
                  fill
                  sizes="120px"
                  style={{ objectFit: "cover" }}
                />
                <span className="home-demo-num" aria-hidden="true">{i + 1}</span>
              </span>
              <span className="home-demo-label">{s.label}</span>
            </li>
          ))}
        </ol>
      </figure>

      <hr className="rule" />

      <section className="home-strip" id="inspiration">
        <div className="home-strip-head">
          <p className="eyebrow">Inspiration</p>
          <h2 className="display-sm">References worth painting</h2>
        </div>
        <ul className="home-strip-track">
          {inspirationGallery.map((item) => (
            <li key={item.id} className="home-strip-item">
              <figure>
                <AppImage
                  src={item.imageUrl}
                  alt={item.title}
                  width={640}
                  height={480}
                  sizes="280px"
                  loading="lazy"
                />
                <figcaption>
                  <span className="home-strip-medium">{item.medium}</span>
                  <span className="home-strip-title">{item.title}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <hr className="rule" />

      <section className="home-close">
        <h2 className="display-sm">Choose a reference. Begin your practice.</h2>
        <Link className="btn-solid btn-lg btn-branded" href="/studio/new">
          <Icon name="plus" size={18} />Create a lesson
        </Link>
      </section>

      <footer className="home-footer">
        <ArtPraxisLogo variant="navigation" size="navigationDesktop" />
        <div className="home-footer-meta">
          <span className="home-footer-note">Practice. Progress. Master.</span>
          <nav className="home-footer-links" aria-label="Legal and support">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/support">Support</Link>
          </nav>
        </div>
      </footer>
    </main>
    </HomeGate>
  );
}
