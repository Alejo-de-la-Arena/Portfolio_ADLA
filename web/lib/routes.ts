import { caseStudies } from "../content/case-studies.ts";
import { locales } from "../content/types.ts";
export const contentSuffixes = ["", "/work", ...caseStudies.map((study) => "/work/" + study.slug)];
export const contentPaths = locales.flatMap((locale) => contentSuffixes.map((suffix) => "/" + locale + suffix));
export const workImagePaths = [...new Set(caseStudies.flatMap(study => [study.cover, ...study.gallery].map(image => image.src)))];
// Open Graph card per locale (app/[locale]/opengraph-image.tsx, generateImageMetadata id). Proxy lets these through.
export const ogImageId = "card";
export const ogImagePath = (locale: string) => "/" + locale + "/opengraph-image/" + ogImageId;
export const ogImagePaths = locales.map(ogImagePath);
