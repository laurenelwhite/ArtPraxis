// Day 0 Welcome Email generator.
//
// Produces emails/day-0-welcome.html: seven stacked, fully clickable medium
// banners that deep-link into /studio/new with the medium preselected, plus a
// primary CTA. Run with:  node scripts/welcome-email.mjs  (or npm run email:welcome)
//
// APP_URL is read from the environment so the same template can target local,
// staging, and production. All artwork is a PLACEHOLDER: progression composites
// are not yet produced/hosted, and each entry records its intended public-domain
// (or to-be-licensed) source for attribution review.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://app.artpraxis.example"
).replace(/\/+$/, "");

const CAMPAIGN = "day_0_welcome";

/**
 * @typedef {"watercolor"|"acrylic"|"oil"|"pastel"|"charcoal"|"pencil"|"pen"} Medium
 */

/** Banner metadata — display copy plus attribution / licensing provenance. */
const BANNERS = [
  {
    medium: "watercolor",
    label: "Watercolor",
    invitation: "Explore watercolor",
    artist: "J. M. W. Turner",
    title: "The Blue Rigi, Sunrise",
    year: "1842",
    museum: "Tate",
    collection: "Tate Britain, London",
    license: "Public Domain",
    sourceUrl: "https://www.tate.org.uk/art/artworks/turner-the-blue-rigi-sunrise-t12336",
    imageUrl: "/assets/welcome/watercolor-progression.png",
    imageAlt:
      "Watercolor progression: light pencil construction, a pale first wash, and a finished luminous mountain-and-lake study after Turner's The Blue Rigi, Sunrise.",
    placeholder: true,
    licenseNote: "Public-domain source; progression composite still to be produced and self-hosted.",
  },
  {
    medium: "acrylic",
    label: "Acrylic",
    invitation: "Begin an acrylic study",
    artist: "TBD — licensed contemporary work required",
    title: "",
    year: "",
    museum: "",
    collection: "",
    license: "REQUIRES LICENSING",
    sourceUrl: "",
    imageUrl: "/assets/welcome/acrylic-progression.png",
    imageAlt:
      "Acrylic progression: block-in of large shapes, mid-layer color, and a finished study.",
    placeholder: true,
    licenseNote:
      "No public-domain acrylic masterwork exists (acrylics postdate ~1950). Requires a licensed contemporary work or an original ArtPraxis demonstration before launch.",
  },
  {
    medium: "oil",
    label: "Oil",
    invitation: "Begin an oil study",
    artist: "Claude Monet",
    title: "Impression, Sunrise",
    year: "1872",
    museum: "Musée Marmottan Monet",
    collection: "Musée Marmottan Monet, Paris",
    license: "Public Domain",
    sourceUrl: "https://www.musee-marmottan.fr/",
    imageUrl: "/assets/welcome/oil-progression.png",
    imageAlt:
      "Oil progression: thin tonal underpainting, blocked-in harbor color, and a finished sunrise study after Monet's Impression, Sunrise.",
    placeholder: true,
    licenseNote: "Public-domain source; progression composite still to be produced and self-hosted.",
  },
  {
    medium: "pastel",
    label: "Pastel",
    invitation: "Explore pastel",
    artist: "Edgar Degas",
    title: "Blue Dancers",
    year: "c. 1897",
    museum: "Pushkin State Museum of Fine Arts",
    collection: "Pushkin Museum, Moscow",
    license: "Public Domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/Category:Blue_Dancers_(Degas)",
    imageUrl: "/assets/welcome/pastel-progression.png",
    imageAlt:
      "Pastel progression: gesture drawing, layered color strokes, and a finished study of dancers after Degas's Blue Dancers.",
    placeholder: true,
    licenseNote: "Public-domain source; progression composite still to be produced and self-hosted.",
  },
  {
    medium: "charcoal",
    label: "Charcoal",
    invitation: "Start with charcoal",
    artist: "Georges Seurat",
    title: "Seated Boy with a Straw Hat",
    year: "1882",
    museum: "Yale University Art Gallery",
    collection: "Yale University Art Gallery, New Haven",
    license: "Public Domain",
    sourceUrl: "https://artgallery.yale.edu/collections/objects/48653",
    imageUrl: "/assets/welcome/charcoal-progression.png",
    imageAlt:
      "Charcoal progression: light contour, massed values, and a finished tonal figure study after Seurat's conté drawing.",
    placeholder: true,
    licenseNote: "Public-domain source; progression composite still to be produced and self-hosted.",
  },
  {
    medium: "pencil",
    label: "Pencil",
    invitation: "Start with pencil",
    artist: "Jean-Auguste-Dominique Ingres",
    title: "Portrait study (graphite)",
    year: "c. 1819",
    museum: "The Metropolitan Museum of Art",
    collection: "The Met, New York",
    license: "Public Domain (CC0)",
    sourceUrl: "https://www.metmuseum.org/art/collection/search?department=11&material=Graphite",
    imageUrl: "/assets/welcome/pencil-progression.png",
    imageAlt:
      "Pencil progression: proportion lay-in, refined contour, and a finished graphite portrait study after Ingres.",
    placeholder: true,
    licenseNote: "Public-domain source; specific graphite work + composite to be confirmed and self-hosted.",
  },
  {
    medium: "pen",
    label: "Pen & Ink",
    invitation: "Draw with pen & ink",
    artist: "Vincent van Gogh",
    title: "Boats at Saintes-Maries (reed pen)",
    year: "1888",
    museum: "Van Gogh Museum",
    collection: "Van Gogh Museum, Amsterdam",
    license: "Public Domain",
    sourceUrl: "https://www.vangoghmuseum.nl/en/collection",
    imageUrl: "/assets/welcome/pen-progression.png",
    imageAlt:
      "Pen and ink progression: light pencil scaffold, structural hatching, and a finished reed-pen drawing after Van Gogh.",
    placeholder: true,
    licenseNote: "Public-domain source; progression composite still to be produced and self-hosted.",
  },
];

/** Build a deep link into the preselected lesson setup for a medium banner. */
function bannerHref(medium) {
  const params = new URLSearchParams({
    medium,
    utm_source: "welcome_email",
    utm_medium: "email",
    utm_campaign: CAMPAIGN,
    utm_content: `${medium}_banner`,
  });
  return `${APP_URL}/studio/new?${params.toString()}`;
}

/** Primary CTA — general setup with no preselected medium. */
function primaryCtaHref() {
  const params = new URLSearchParams({
    utm_source: "welcome_email",
    utm_medium: "email",
    utm_campaign: CAMPAIGN,
    utm_content: "primary_cta",
  });
  return `${APP_URL}/studio/new?${params.toString()}`;
}

/**
 * Order banners for the email. If the user picked a preferred medium during
 * onboarding, move that banner to the first position; otherwise keep the
 * recommended order.
 * @param {Medium|null} preferredMedium
 */
function orderedBanners(preferredMedium = null) {
  if (!preferredMedium) return BANNERS;
  const preferred = BANNERS.filter((b) => b.medium === preferredMedium);
  const rest = BANNERS.filter((b) => b.medium !== preferredMedium);
  return [...preferred, ...rest];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attributionLine(b) {
  const parts = [];
  if (b.artist) parts.push(b.artist);
  if (b.title) parts.push(`<em>${escapeHtml(b.title)}</em>${b.year ? ` (${escapeHtml(b.year)})` : ""}`);
  const source = [b.museum || b.collection, b.license].filter(Boolean).join(" · ");
  const artistTitle = parts.join(", ");
  return [artistTitle, source].filter(Boolean).join(" — ");
}

function bannerRow(b) {
  const href = bannerHref(b.medium);
  const attribution = attributionLine(b);
  // The whole banner is an anchor; the CTA is also present as real text (not
  // only inside the image). Clickability is signaled by an underlined label
  // plus an arrow, never by color alone.
  return `
        <tr>
          <td style="padding:0 0 16px 0;">
            <a class="banner" href="${escapeHtml(href)}"
               style="display:block;text-decoration:none;color:#171717;border:1px solid #DDDAD4;border-radius:10px;overflow:hidden;background:#FFFFFF;">
              <img src="${escapeHtml(b.imageUrl)}" width="600" alt="${escapeHtml(b.imageAlt)}"
                   style="display:block;width:100%;max-width:600px;height:auto;border:0;background:#F2F0EC;" />
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:18px 20px 20px 20px;font-family:Georgia,'Times New Roman',serif;">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#A35F38;">${escapeHtml(b.label)}</div>
                    <div style="font-size:22px;line-height:1.25;color:#171717;margin:6px 0 2px 0;">${escapeHtml(b.invitation)}</div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#66635F;margin:4px 0 0 0;">${attribution}</div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#8A8681;margin:6px 0 12px 0;">How ArtPraxis might break this work into a ${escapeHtml(b.label.toLowerCase())} study.</div>
                    <span class="banner-cta" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#315B8A;text-decoration:underline;">${escapeHtml(b.invitation)} &rarr;</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>`;
}

function renderWelcomeEmailHtml(preferredMedium = null) {
  const banners = orderedBanners(preferredMedium).map(bannerRow).join("\n");
  const cta = primaryCtaHref();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Welcome to ArtPraxis</title>
  <style>
    /* Focus state for web-based clients that retain <style>. Not color-only. */
    a.banner:focus { outline: 3px solid #315B8A; outline-offset: 2px; }
    a.banner:focus-visible { outline: 3px solid #315B8A; outline-offset: 2px; }
    a.primary-cta:focus, a.primary-cta:focus-visible { outline: 3px solid #FCFCFA; outline-offset: 2px; }
    a.banner:hover .banner-cta { text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background:#FCFCFA;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FCFCFA;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
          <tr>
            <td style="padding:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;color:#66635F;">ArtPraxis</div>
              <h1 style="font-size:30px;line-height:1.2;color:#171717;margin:8px 0 6px 0;font-weight:bold;">Welcome — pick a medium and start painting</h1>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#66635F;margin:0;">Each study below shows how a masterwork can be broken into stages — from the first pencil sketch through to the finished study. Tap any medium to begin a lesson in it right away.</p>
            </td>
          </tr>
${banners}
          <tr>
            <td align="center" style="padding:14px 0 8px 0;">
              <a class="primary-cta" href="${escapeHtml(cta)}"
                 style="display:inline-block;background:#171717;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:999px;">Start your first lesson &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#8A8681;">
              <p style="margin:0;">Artwork shown for study reference under public-domain or licensed terms. AI-generated stages illustrate a possible learning breakdown and do not document any artist's actual historic working process.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(here, "..", "emails", "day-0-welcome.html");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, renderWelcomeEmailHtml(), "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(`APP_URL = ${APP_URL}`);
  for (const b of BANNERS) console.log(`  ${b.medium.padEnd(11)} -> ${bannerHref(b.medium)}`);
  console.log(`  primary_cta -> ${primaryCtaHref()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { BANNERS, bannerHref, primaryCtaHref, orderedBanners, renderWelcomeEmailHtml };
