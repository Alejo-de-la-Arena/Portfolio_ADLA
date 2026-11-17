import type { WorkImage } from "@/content/types";

export type ShotRow = { desktop?: WorkImage; mobile?: WorkImage };

/** Groups a case study's screenshots, in content order, into rows: each desktop capture starts a row and
    the mobile capture right after it joins as its pair. A mobile with no desktop before it gets its own row. */
export function pairScreenshots(images: readonly WorkImage[]): ShotRow[] {
  const rows: ShotRow[] = [];
  for (const image of images) {
    const last = rows[rows.length - 1];
    if (image.variant === "mobile" && last?.desktop && !last.mobile) last.mobile = image;
    else rows.push(image.variant === "desktop" ? { desktop: image } : { mobile: image });
  }
  return rows;
}
