import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "Tide Operations",
    template: "%s · Tide Operations",
  },
  description:
    "Tide Events Group Scotland's operations platform — planning, documents, risk, readiness, and live incident control.",
  icons: {
    icon: "https://res.cloudinary.com/p8fhvvbp/image/upload/v1785770678/2_wktobe.png",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tide Ops",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f1e1e",
};

// Applies the stored/system theme before first paint so there's no flash
// of the wrong theme. Kept as a plain inline script (no next-themes
// dependency) — this is the entire theming system.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
