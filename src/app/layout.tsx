import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { SWRegistrar } from "@/components/sw-registrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "GWS Platform V2 — Land Surveying & Property Management",
  description: "Comprehensive land surveying and property management platform for Uganda/East Africa. Powered by Geomatics Workstation Services Ltd.",
  keywords: ["GWS", "Land Surveying", "Uganda", "East Africa", "Property Management", "GIS", "Spatial"],
  authors: [{ name: "Geomatics Workstation Services Ltd" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GWS Platform",
  },
  openGraph: {
    type: "website",
    siteName: "GWS Platform V2",
    title: "GWS Platform V2 — Land Surveying & Property Management",
    description: "Comprehensive land surveying and property management platform for Uganda/East Africa.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster richColors position="bottom-right" />
          <SWRegistrar />
        </AuthProvider>
      </body>
    </html>
  );
}
