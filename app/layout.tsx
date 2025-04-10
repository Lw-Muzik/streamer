import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./manifest.json";
import { Suspense } from "react";
import ReduxProvider from "../providers/ReduxProvider";
import { AudioProvider } from "@/contexts/AudioContext";
import ThemeProvider from '@/providers/ThemeProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Ethereal Tunes',
  description: 'Music Player Web App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="manifest" href="manifest.json" />
      <link rel="apple-touch-icon" href="favicon.png" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <ReduxProvider>
              <AudioProvider>
                {children}
              </AudioProvider>
            </ReduxProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
