import { formatting } from "@/content/dictionary";
import type { Locale, RichText } from "@/content/types";

export function TextContent({ item, locale }: { item: RichText; locale: Locale }) {
  return <>{item.lead && <><strong>{item.lead[locale]}</strong>{formatting.leadSeparator[locale]}</>}
    {item.segments.map((segment, index) => {
      switch (segment.type) {
        case "text": return <span key={index}>{segment.value[locale]}</span>;
        case "code": return <code key={index}>{segment.value}</code>;
        case "link": return <a key={index} href={segment.href}>{segment.label[locale]}</a>;
      }
    })}
  </>;
}
