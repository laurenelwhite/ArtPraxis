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

const lessonContents = [
  {
    title: "A plan for seeing",
    body: "Composition, proportion, major shapes, light, and value are organized before detail begins.",
  },
  {
    title: "Materials for your medium",
    body: "Receive a focused supply list plus a color palette, value key, or line guide suited to the way you work.",
  },
  {
    title: "Six cumulative demonstrations",
    body: "Each image shows only what has been built so far, from the first structure to the final accents.",
  },
  {
    title: "Instructions with a purpose",
    body: "Every stage explains what to notice, what to make, and why that decision strengthens the artwork.",
  },
  {
    title: "Medium-specific technique",
    body: "Practice the handling that matters for your materials: washes, layers, masses, hatching, edges, or mark-making.",
  },
  {
    title: "A lesson you can return to",
    body: "Save the lesson in your studio, mark your progress, and keep the reference beside each demonstration as you work.",
  },
];

const supportedMedia = [
  {
    name: "Watercolor",
    kind: "Transparent paint",
    body: "Preserve the paper, control water and pigment, build transparent washes, and time soft and hard edges.",
  },
  {
    name: "Acrylic",
    kind: "Fast-drying paint",
    body: "Block in value masses, layer opaque and transparent color, manage drying time, and vary the brushwork.",
  },
  {
    name: "Oil",
    kind: "Slow-drying paint",
    body: "Establish an underpainting, mix value and temperature, model form in layers, and finish with glazes or scumbles.",
  },
  {
    name: "Pastel",
    kind: "Direct color",
    body: "Set the large value masses, layer pigment into the paper tooth, blend selectively, and sharpen focal edges.",
  },
  {
    name: "Charcoal",
    kind: "Tonal drawing",
    body: "Measure gesture and proportion, mass the shadows, lift light with an eraser, and control the edge hierarchy.",
  },
  {
    name: "Pencil",
    kind: "Graphite drawing",
    body: "Construct the shapes lightly, check proportions, build value with hatching, and refine form without overworking it.",
  },
  {
    name: "Pen",
    kind: "Ink drawing",
    body: "Plan the structure, vary line weight, build value through hatching and density, and reserve the darkest marks for focus.",
  },
];

export default function Home() {
  return (
    <HomeGate>
    <main className="site">

      <LandingMasthead />

      <section className="home-hero" id="main-content" tabIndex={-1}>
        <div className="home-hero-brand" aria-hidden="true">
          <ArtPraxisLogo variant="primary" size="primary" decorative />
        </div>
        <p className="eyebrow">Personalized lessons for painting and drawing</p>
        <h1 className="display">Turn any reference into an art lesson made for you.</h1>
        <p className="home-lede">
          <em>Praxis</em> means knowledge made real through practice. Upload a reference,
          choose your medium, and ArtPraxis builds a guided lesson in composition,
          proportion, <Term id="value">value</Term>, color, edges, and technique — with
          progressive demonstrations you can follow at your own easel.
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
          <figcaption>One reference. Six progressive studies — from first structure to final accents.</figcaption>
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

      <section className="home-explainer" id="what-you-get" aria-labelledby="home-explainer-title">
        <div className="home-section-intro">
          <p className="eyebrow">What ArtPraxis makes</p>
          <h2 className="display-sm" id="home-explainer-title">
            A complete studio lesson built around your reference.
          </h2>
          <p>
            ArtPraxis studies the image as an art instructor would: first the composition
            and large shapes, then the value structure, color relationships, edges, and
            medium handling. It turns that analysis into a practical sequence you can make
            by hand — not a filter and not a finished image you are expected to copy at once.
          </p>
        </div>

        <ol className="home-process" aria-label="How ArtPraxis creates a lesson">
          <li>
            <span className="home-process-number" aria-hidden="true">1</span>
            <div>
              <h3>Bring a reference</h3>
              <p>Use a photo or artwork you want to study: a portrait, landscape, still life, pet, figure, or place.</p>
            </div>
          </li>
          <li>
            <span className="home-process-number" aria-hidden="true">2</span>
            <div>
              <h3>Choose how you want to work</h3>
              <p>Select one of seven supported media and, if you wish, set the lesson for beginner, intermediate, or advanced practice.</p>
            </div>
          </li>
          <li>
            <span className="home-process-number" aria-hidden="true">3</span>
            <div>
              <h3>Make it stage by stage</h3>
              <p>Follow the demonstrations beside your reference, prepare the recommended materials, and record your progress in the studio.</p>
            </div>
          </li>
        </ol>

        <div className="home-includes">
          <p className="eyebrow">Every lesson includes</p>
          <ul>
            {lessonContents.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr className="rule" />

      <section className="home-media" id="media" aria-labelledby="home-media-title">
        <div className="home-section-intro">
          <p className="eyebrow">Seven ways to work</p>
          <h2 className="display-sm" id="home-media-title">The method changes with the medium.</h2>
          <p>
            The foundations of seeing stay consistent, but the lesson vocabulary, materials,
            demonstrations, and techniques adapt to the physical character of your chosen medium.
          </p>
        </div>
        <ul className="home-media-grid">
          {supportedMedia.map((medium) => (
            <li key={medium.name}>
              <p className="home-media-kind">{medium.kind}</p>
              <h3>{medium.name}</h3>
              <p>{medium.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-learning" aria-labelledby="home-learning-title">
        <p className="eyebrow">Built for practice</p>
        <h2 className="display-sm" id="home-learning-title">Learn the making, not just the result.</h2>
        <p>
          Early demonstrations remain intentionally spare so you can see what belongs in each
          stage. The sequence moves from simple shapes and value families toward color, form,
          edges, and selective detail. That progression makes the reference approachable and
          gives you a process you can use again on the next artwork.
        </p>
      </section>

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
        <p className="eyebrow">Practice. Progress. Master.</p>
        <h2 className="display-sm">Choose a reference. Build the skills to make it your own.</h2>
        <p>Start with watercolor, acrylic, oil, pastel, charcoal, pencil, or pen.</p>
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
