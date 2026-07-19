import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"ArtPraxis",description:"Turn a reference image into a personalized art lesson."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
