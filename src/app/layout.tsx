import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Tide Operations",
    template: "%s · Tide Operations",
  },
  description:
    "Tide Events Group Scotland's operations platform — planning, documents, risk, readiness, and live incident control.",
  icons: {
    icon: "https://res.cloudinary.com/p8fhvvbp/image/upload/v1785770678/2_wktobe.png",
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
