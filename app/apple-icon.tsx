import { ImageResponse } from "next/og";
import { AppIconArtwork } from "@/components/ui/layout/app-icon-artwork";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconArtwork />, size);
}