import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import Work from "@/app/[locale]/work/page";
import CaseStudyPage from "@/app/[locale]/work/[slug]/page";
import { locales } from "@/content/types";
import { projectEntries } from "@/content/projects";
import { findCaseStudy } from "@/content/case-studies";

it.each(locales)("/work en %s muestra el empleo una vez y siete proyectos sin fechas", async locale => {
  const html = renderToStaticMarkup(await Work({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }));
  const group = html.match(/<section><h2>Zetenta<\/h2>([\s\S]*?)<\/section>/)?.[1];
  expect(group).toBeDefined();
  expect(group?.match(/<time /g)).toHaveLength(2);
  expect(group).toContain('dateTime="2025-04"');
  expect(group).toContain('dateTime="2025-10"');
  expect(group?.match(/<article>/g)).toHaveLength(7);
  expect(group?.split("<ul>")[0]).toContain(locale === "es" ? "Relación de dependencia" : "Employment");
  expect(group?.slice(group.indexOf("<ul>"))).not.toContain("<time");
  for (const entry of projectEntries.filter(entry => entry.employer === "Zetenta")) {
    expect(group).toContain(entry.name[locale]);
  }
  const laura = projectEntries.find(entry => entry.slug === "kyriazis");
  expect(laura?.period).toEqual({ start: "2024-04", end: "2026-08" });
  expect(laura?.stack).toEqual(["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "next-intl", "Resend"]);
  expect(html).toContain(laura?.summary[locale]);
  expect(html).toContain('<a href="https://kyriazislawyer.com">');
});

it.each(locales)("Solution en %s conserva su período y aclara el enlace archivado", async locale => {
  expect(findCaseStudy("solution")?.period).toEqual({ start: "2026-02", end: "2026-09" });
  const html = renderToStaticMarkup(await CaseStudyPage({ params: Promise.resolve({ locale, slug: "solution" }), searchParams: Promise.resolve({}) }));
  const label = locale === "es" ? "Ver versión archivada (checkout desactivado)" : "View archived version (checkout disabled)";
  expect(html).toContain('<a href="https://solution-topaz.vercel.app">' + label + "</a>");
});
