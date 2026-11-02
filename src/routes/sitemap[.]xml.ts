import { createFileRoute } from "@tanstack/react-router";

import { fetchProjects } from "@/lib/queries";
import { SITE_URL } from "@/lib/supabase";

/** /sitemap.xml for Google: every public page plus each published project, built on request. */
const STATIC = [
  { path: "/", priority: "1.0" },
  { path: "/work", priority: "0.9" },
  { path: "/services", priority: "0.9" },
  { path: "/quote", priority: "0.9" },
  { path: "/events", priority: "0.8" },
  { path: "/branding", priority: "0.8" },
  { path: "/social", priority: "0.8" },
  { path: "/about", priority: "0.7" },
  { path: "/contact", priority: "0.7" },
  { path: "/terms", priority: "0.3" },
  { path: "/privacy", priority: "0.3" },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let projects: Awaited<ReturnType<typeof fetchProjects>> = [];
        try {
          projects = await fetchProjects();
        } catch {
          // Still serve the static pages if the database is unreachable.
        }
        const urls = [
          ...STATIC.map(
            (p) =>
              `<url><loc>${esc(SITE_URL + p.path)}</loc><priority>${p.priority}</priority></url>`,
          ),
          ...projects.map(
            (p) =>
              `<url><loc>${esc(`${SITE_URL}/work/${p.slug}`)}</loc>${
                p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : ""
              }<priority>0.6</priority></url>`,
          ),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
