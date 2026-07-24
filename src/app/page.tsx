import Link from "next/link";
import { HomeGate } from "@/components/HomeGate";
import { Icon } from "@/components/Icon";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";
import { AppImage } from "@/components/ui/AppImage";
import { inspirationGallery } from "@/lib/inspiration";
import { Term } from "@/components/vocabulary/Term";

// Demonstrates the product: one reference resolving through the six stages.
const demoStages = [
  { label: "Observation", filter: "grayscale(1) contrast(1.32) brightness(1.14)" },
  { label: "Value study", filter: "grayscale(1) contrast(1.08)" },
  { label: "First wash", filter: "saturate(.32) brightness(1.07) contrast(.95)" },
  { label: "Second wash", filter: "saturate(.62) brightness(1.02)" },
  { label: "Refinement", filter: "saturate(.86)" },
  { label: "Finished", filter: "none" },
];
const demoSeed = "https://picsum.photos/seed/artpraxis-demo/900/620";

export default function Home() {
  return (
    <HomeGate>
    <main className="site">

      <header className="masthead">
        <Link href="/" aria-label="ArtPraxis home" className="masthead-brand">
          <ArtPraxisLogo
            variant="navigation"
            size="navigationDesktop"
            className="ap-logo--responsive-nav"
            decorative
          />
        </Link>
        <nav className="masthead-nav">
          <a href="#how">How it works</a>
          <a href="#inspiration">Inspiration</a>
          <Link href="/studio" className="masthead-signin">Sign in</Link>
          <Link href="/studio" className="btn-solid btn-branded">Create a lesson</Link>
        </nav>
      </header>

      <section className="home-hero">
        <div className="home-hero-brand" aria-hidden="true">
          <ArtPraxisLogo variant="primary" size="primary" decorative />
        </div>
        <p className="eyebrow">Personalized atelier instruction</p>
        <h1 className="display">Turn any photo into a lesson you can actually make.</h1>
        <p className="home-lede">
          Upload a reference, choose your medium, and ArtPraxis composes a visual, stage-by-stage
          lesson — observation, <Term id="value">value</Term>, guided passes, and finish —
          the way a good instruction book would. Tap any term to learn the language of your medium as you go.
        </p>
        <div className="home-cta">
          <Link className="btn-solid btn-lg btn-branded" href="/studio">
            <Icon name="sparkles" size={18} />Create a lesson
          </Link>
          <Link className="btn-ghost" href="#how">See how it works</Link>
        </div>
      </section>

      <figure className="home-demo" id="how">
        <div className="home-demo-hero">
          <AppImage
            src={demoSeed}
            alt="Reference photo being turned into a guided atelier lesson"
            width={900}
            height={506}
            sizes="(max-width: 900px) 100vw, 900px"
            priority
          />
          <figcaption>From one reference to a finished study, in six guided stages.</figcaption>
        </div>
        <ol className="home-demo-strip" aria-label="The six stages">
          {demoStages.map((s, i) => (
            <li key={s.label}>
              <span className="home-demo-thumb">
                <AppImage
                  src={demoSeed}
                  alt={`${s.label} stage`}
                  fill
                  sizes="120px"
                  style={{ filter: s.filter, objectFit: "cover" }}
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
          <h2 className="display-sm">Ideas worth studying</h2>
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
        <h2 className="display-sm">Start with the reference on your desk right now.</h2>
        <Link className="btn-solid btn-lg btn-branded" href="/studio">
          <Icon name="plus" size={18} />Create a lesson
        </Link>
      </section>

      <footer className="home-footer">
        <ArtPraxisLogo variant="navigation" size="navigationDesktop" />
        <span className="home-footer-note">From practice to mastery.</span>
      </footer>
    </main>
    </HomeGate>
  );
}
