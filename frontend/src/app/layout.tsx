import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PhosphorProvider } from "@/components/PhosphorProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TryOnHub | Plataforma B2B2C de Prueba Virtual 3D",
    template: "%s | TryOnHub"
  },
  description: "Virtual Try-On Platform - El mejor sistema paramétrico 3D de prendas.",
  keywords: ["virtual try on", "3d clothes", "ecommerce 3d", "gemini ai fashion"],
  openGraph: {
    title: "TryOnHub",
    description: "Virtual Try-On Platform",
    url: "https://tryonhub.demo",
    siteName: "TryOnHub",
    type: "website",
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* SVG Optical Refraction Filter for Liquid Glass surfaces */}
        <svg className="pointer-events-none fixed inset-0 h-0 w-0 opacity-0" aria-hidden="true">
          <defs>
            <filter id="liquid-glass-refract" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <ThemeProvider>
          <PhosphorProvider>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </AuthProvider>
          </PhosphorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
