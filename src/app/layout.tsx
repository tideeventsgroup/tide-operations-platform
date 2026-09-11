import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/operations/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sential",
  description: "Incident Control for live event operations.",
  applicationName: "Sential",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // iOS ignores the web manifest, so home-screen behaviour is declared here.
  appleWebApp: {
    capable: true,
    title: "Sential",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    // Stop iOS turning references and times in an incident record into
    // phone-call links.
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#373536",
  // Field staff work one-handed on a phone; allow zoom for legibility rather
  // than locking the scale.
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
