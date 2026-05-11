import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Tron-style display (grid / sci-fi UI) — used for THE ARENA branding + dashboard numerals */
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "021",
    template: "%s | 021",
  },
  description:
    "A faith-driven entrepreneurship community for high school students. Submit video pitches, receive AI-powered feedback, compete for monthly prizes, and connect with like-minded young founders.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${orbitron.variable} dark`}
    >
      <body className="min-h-dvh bg-surface-primary text-text-primary antialiased">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
