import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "../styles/artpraxis-tokens.css";
import "./globals.css";
import "./globals-app-shell.css";
import { AuthProvider } from "@/providers/AuthProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-sans",
  display: "swap",
});

function configuredSiteUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: configuredSiteUrl(),
  title: {
    default: "ArtPraxis — Personalized art lessons from any reference",
    template: "%s · ArtPraxis",
  },
  description:
    "Turn any reference into a personalized, stage-by-stage lesson for watercolor, acrylic, oil, pastel, charcoal, pencil, or pen.",
  applicationName: "ArtPraxis",
  category: "education",
  keywords: [
    "painting lessons",
    "personalized art lessons",
    "watercolor instruction",
    "art practice",
    "painting tutorial",
    "drawing lessons",
    "charcoal drawing",
    "pencil drawing",
    "pastel lessons",
  ],
  openGraph: {
    type: "website",
    siteName: "ArtPraxis",
    title: "ArtPraxis — Personalized art lessons from any reference",
    description:
      "Choose a reference and medium. Receive a practical, stage-by-stage lesson you can make at your own easel.",
  },
  twitter: {
    card: "summary",
    title: "ArtPraxis — Personalized art lessons from any reference",
    description: "Practical lessons for watercolor, acrylic, oil, pastel, charcoal, pencil, and pen.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/artpraxis-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/artpraxis-mark.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2ECE3",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
