import type { Metadata } from "next";
import { Inter, Noto_Serif } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthProvider from "./providers/AuthProvider";

const notoSerif = Noto_Serif({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nepal Uncharted | Discover the Uncharted Heart of Nepal",
  description:
    "Discover hidden valleys, ancient traditions, and sustainable exploration across the uncharted heart of Nepal.",
  keywords: [
    "Nepal tourism",
    "cultural travel",
    "heritage trails",
    "Nepal homestay",
    "artisan workshops",
    "trekking Nepal",
    "sustainable tourism",
  ],
  openGraph: {
    title: "Nepal Uncharted | Discover the Uncharted Heart of Nepal",
    description:
      "Beyond the maps and crowded peaks lies a Nepal of hidden valleys, ancient traditions, and sustainable exploration.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSerif.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        <AuthProvider>
          <Navbar />
          <main className="pt-20">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
