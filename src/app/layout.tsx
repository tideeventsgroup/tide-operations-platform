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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
