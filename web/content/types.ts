export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export type Localized<T> = { readonly [L in Locale]: T };
export type Text = Localized<string>;
/** Calendar validity is checked at runtime; a month represents its first day for ordering. */
export type ISODate = `${number}-${number}` | `${number}-${number}-${number}`;
export type InlineSegment =
  | { type: "text"; value: Text }
  | { type: "code"; value: string }
  | { type: "link"; label: Text; href: string };
export type RichText = { segments: readonly InlineSegment[]; lead?: Text };
export type Period = { start: ISODate; end?: ISODate | null };
export type WorkImage = {
  src: string;
  alt: Text;
  width: number;
  height: number;
  variant: "desktop" | "mobile";
};
export type ContentBlock =
  | ({ type: "paragraph" } & RichText)
  | { type: "bullets"; items: readonly RichText[] };
export type CaseStudy = {
  slug: string;
  title: Text;
  roleLine: Text;
  period: Period & { end: ISODate | null };
  status: "live" | "archived" | "ongoing";
  featured: boolean;
  order: number;
  summary: Text;
  cover: WorkImage;
  gallery: readonly WorkImage[];
  stack: readonly string[];
  links: readonly { label: Text; href: string }[];
  highlights: readonly Text[];
  sections: readonly { heading: Text; blocks: readonly ContentBlock[] }[];
};
export type ProjectEntry = {
  slug: string;
  name: Text;
  client: string;
  role: Text;
  stack: readonly string[];
  summary: Text;
  url?: string;
} & (
  | { employer: string; period?: Period }
  | { employer?: never; period: Period }
);

export type Employment = {
  employer: string;
  period: Period & { end: ISODate | null };
  relationship: Text;
};
