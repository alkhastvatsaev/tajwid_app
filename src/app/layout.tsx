import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="font-outfit">
        {children}
      </body>
    </html>
  );
}
