import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "./context/GameContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Giftorden - Das Antiallergikum-Rätsel",
  description: "Ein Junggesellenabschied-Abenteuer für Dominik",
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Ensure CSS loads immediately */
            html { background: #0a0a0a; color: #ededed; }
            body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
          `
        }} />
      </head>
      <body className="antialiased min-h-screen bg-gray-900 text-white">
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
