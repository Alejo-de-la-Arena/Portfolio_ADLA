import { caseStudies } from "../content/case-studies.ts";
import { locales } from "../content/types.ts";
export const contentSuffixes = ["", "/work", ...caseStudies.map((study) => "/work/" + study.slug)];
export const contentPaths = locales.flatMap((locale) => contentSuffixes.map((suffix) => "/" + locale + suffix));
