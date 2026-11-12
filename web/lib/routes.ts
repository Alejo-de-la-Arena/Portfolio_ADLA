import { caseStudies } from "../content/case-studies.ts";
import { locales } from "../content/types.ts";
export const contentSuffixes = ["", "/work", ...caseStudies.map((study) => "/work/" + study.slug)];
export const contentPaths = locales.flatMap((locale) => contentSuffixes.map((suffix) => "/" + locale + suffix));
export const workImagePaths = [...new Set(caseStudies.flatMap(study => [study.cover, ...study.gallery].map(image => image.src)))];
/** Design previews: allowed by Proxy, noindex, and kept out of the indexable content checks. */
export const previewSuffixes = ["/preview/a", "/preview/b"];
export const previewPaths = locales.flatMap((locale) => previewSuffixes.map((suffix) => "/" + locale + suffix));
