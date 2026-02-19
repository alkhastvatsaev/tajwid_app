import type { Metadata } from "next";
import { Outfit, Amiri } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  title: "TAJWID AI | Professional Quran Learning",
  description: "Master Tajwid with AI-powered realtime feedback and duo mode.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${amiri.variable}`}>
      <body className="font-outfit">
        {children}
      </body>
    </html>
  );
}
