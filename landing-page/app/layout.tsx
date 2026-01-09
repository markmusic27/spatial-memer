import type { Metadata } from "next";
import { EB_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spatial-MemER",
  description: "Spatial memory for hierarchical VLA policies",
  keywords: ["robotics", "spatial memory", "robot memory", "VLA policies", "robot learning"],
  authors: [
    { name: "Mark Music", url: "https://markmusic.io" },
    { name: "Filippo Fonseca", url: "https://filippofonseca.com" }
  ],
  openGraph: {
    title: "Spatial-MemER",
    description: "Spatial memory for hierarchical VLA policies.",
    type: "website",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Spatial memory for hierarchical VLA policies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spatial-MemER",
    description: "Spatial memory for hierarchical VLA policies.",
    images: ["/thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ebGaramond.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
