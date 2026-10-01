import type { MetadataRoute } from "next";
import { UI_TEXT } from "@/domain/literales.constantes";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: UI_TEXT.metadata.title,
    short_name: UI_TEXT.brand,
    description: UI_TEXT.metadata.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f7fb",
    theme_color: "#123c34",
    icons: [
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}