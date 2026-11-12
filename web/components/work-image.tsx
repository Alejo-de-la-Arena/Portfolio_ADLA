import Image from "next/image";
import type { Locale, WorkImage as ImageContent } from "@/content/types";

export function WorkImage({ image, locale }: { image: ImageContent; locale: Locale }) {
  return <Image src={image.src} alt={image.alt[locale]} width={image.width} height={image.height}
    className={image.variant === "mobile" ? "screenshot mobile" : "screenshot"}
    sizes={image.variant === "mobile" ? "(max-width: 400px) 90vw, 360px" : "(max-width: 800px) 95vw, 800px"} />;
}
