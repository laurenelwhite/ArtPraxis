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
    default: "ArtPraxis — Personalized painting lessons",
    template: "%s · ArtPraxis",
  },
  description:
    "Turn any reference into a personalized painting lesson built around observation, value, color, edges, and deliberate practice.",
  applicationName: "ArtPraxis",
  category: "education",
  keywords: [
    "painting lessons",
    "personalized art lessons",
    "watercolor instruction",
    "art practice",
    "painting tutorial",
  ],
  openGraph: {
    type: "website",
    siteName: "ArtPraxis",
    title: "ArtPraxis — Personalized painting lessons",
    description:
      "Paint what you see, one deliberate stage at a time.",
  },
  twitter: {
    card: "summary",
    title: "ArtPraxis — Personalized painting lessons",
    description: "Paint what you see, one deliberate stage at a time.",
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
