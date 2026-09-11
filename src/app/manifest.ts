import type { MetadataRoute } from "next";

/**
 * Installable app definition, served at /manifest.webmanifest.
 *
 * Field staff install this to a home screen so reporting an incident is one tap
 * from the lock screen rather than a browser, a bookmark and a sign-in page.
 *
 * start_url points at event selection rather than a fixed event, so the shortcut
 * stays correct once this event closes and the next one opens.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sential Event Control",
    short_name: "Sential",
    description: "Incident Control for live event operations.",
    start_url: "/select-event",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#373536",
    theme_color: "#373536",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops icons to its own shape; this one keeps the mark inside the
      // safe zone so it is not clipped.
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
