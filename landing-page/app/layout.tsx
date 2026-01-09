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
  title: "Spatial-MemER: Spatial Memory for Embodied Robots",
  description: "Adding spatial awareness to vision-language robot policies through egocentric mapping and forward kinematics.",
  keywords: ["robotics", "spatial memory", "VLM", "embodied AI", "robot learning"],
  authors: [
    { name: "Mark Music", url: "https://markmusic.io" },
    { name: "Filippo Fonseca", url: "https://filippofonseca.com" }
  ],
  openGraph: {
    title: "Spatial-MemER: Spatial Memory for Embodied Robots",
    description: "Adding spatial awareness to vision-language robot policies through egocentric mapping and forward kinematics.",
    type: "website",
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
