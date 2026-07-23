import Link from "next/link";
import { RedirectIfAuthed } from "@/components/RedirectIfAuthed";
import { Icon } from "@/components/Icon";
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
    <main className="site">
      <RedirectIfAuthed />

      <header className="masthead">
        <Link href="/" className="wordmark">ArtPraxis</Link>
        <nav className="masthead-nav">
          <a href="#how">How it works</a>
          <a href="#inspiration">Inspiration</a>
          <Link href="/studio" className="masthead-signin">Sign in</Link>
          <Link href="/studio" className="btn-solid">Start a painting</Link>
        </nav>
      </header>

      <section className="home-hero">
        <p className="eyebrow">Personalized painting instruction</p>
        <h1 className="display">Turn any photo into a painting you can actually make.</h1>
        <p className="home-lede">
          Upload a reference, choose your medium, and ArtPraxis composes a visual, stage-by-stage
          lesson — pencil sketch, <Term id="value">value</Term>, <Term id="wash">washes</Term>, and finish —
          the way a good instruction book would. Tap any term to learn the language of painting as you go.
        </p>
        <div className="home-cta">
          <Link className="btn-solid btn-lg" href="/studio"><Icon name="sparkles" size={18} />Start a painting</Link>
          <span className="home-cta-note">Free to start · no credit card</span>
        </div>
      </section>

      <figure className="home-demo" id="how">
        <div className="home-demo-hero">
          <img src={demoSeed} alt="Reference photo being turned into a painting lesson" />
          <figcaption>From one reference to a finished painting, in six guided stages.</figcaption>
        </div>
        <ol className="home-demo-strip" aria-label="The six stages">
          {demoStages.map((s, i) => (
            <li key={s.label}>
              <span className="home-demo-thumb">
                <img src={demoSeed} alt={`${s.label} stage`} style={{ filter: s.filter }} />
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
          <h2 className="display-sm">Ideas worth painting</h2>
        </div>
        <ul className="home-strip-track">
          {inspirationGallery.map((item) => (
            <li key={item.id} className="home-strip-item">
              <figure>
                <img src={item.imageUrl} alt={item.title} loading="lazy" />
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
        <Link className="btn-solid btn-lg" href="/studio"><Icon name="plus" size={18} />Start a painting</Link>
      </section>

      <footer className="home-footer">
        <span className="wordmark">ArtPraxis</span>
        <span className="home-footer-note">Editorial precision, tactile atelier.</span>
      </footer>
    </main>
  );
}
