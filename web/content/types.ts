export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export type Localized<T> = { readonly [L in Locale]: T };
export type Text = Localized<string>;
/** Calendar validity is checked at runtime; a month represents its first day for ordering. */
export type ISODate = `${number}-${number}` | `${number}-${number}-${number}`;
export type RichText = { text: Text; lead?: Text };
export type ContentBlock =
  | ({ type: "paragraph" } & RichText)
  | { type: "bullets"; items: readonly RichText[] };
export type CaseStudy = {
  slug: string;
  title: Text;
  roleLine: Text;
  period: { start: ISODate; end: ISODate | null };
  stack: readonly string[];
  links: readonly { label: Text; href: string }[];
  highlights: readonly Text[];
  sections: readonly { heading: Text; blocks: readonly ContentBlock[] }[];
};
