import { inspirationGallery } from "@/lib/inspiration";
import { AppImage } from "@/components/ui/AppImage";

// Horizontal editorial strip rather than a grid of cards.
export function InspirationGallery() {
  return (
    <section className="inspiration-strip" aria-label="Inspiration">
      <div className="section-heading">
        <p className="eyebrow">Inspiration</p>
      </div>
      <ul className="inspiration-track">
        {inspirationGallery.map((item) => (
          <li key={item.id} className="inspiration-item">
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
                <span className="inspiration-medium">{item.medium}</span>
                <span className="inspiration-title">{item.title}</span>
                <span className="inspiration-note">{item.prompt}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
