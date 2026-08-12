import type { Metadata, Viewport } from "next";
import { Amiri, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Tilmidh تلميذ — Entraînement Tajwid mot à mot",
  description:
    "Récite le Coran, le micro vérifie chaque mot. Couleurs tajwid, Fātiḥah, Ikhlāṣ, Duo imam/talib.",
  applicationName: "Tilmidh",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tilmidh",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${amiri.variable}`}>
      <body className="font-outfit antialiased">{children}</body>
    </html>
  );
}
