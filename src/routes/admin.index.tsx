import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader } from "@/components/admin/Shell";
import { formatDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Inquiry } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const sb = getSupabase();
      const [projects, published, featured, inquiries, unread, latest] = await Promise.all([
        sb.from("projects").select("id", { count: "exact", head: true }),
        sb.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
        sb
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("is_featured", true)
          .eq("is_published", true),
        sb.from("inquiries").select("id", { count: "exact", head: true }),
        sb.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
        sb.from("inquiries").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        projects: projects.count ?? 0,
        published: published.count ?? 0,
        featured: featured.count ?? 0,
        inquiries: inquiries.count ?? 0,
        unread: unread.count ?? 0,
        latest: (latest.data ?? []) as Inquiry[],
      };
    },
  });
  const s = stats.data;

  return (
    <div>
      <PageHeader title="Dashboard" text="What's on the site right now." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Projects"
          value={s?.projects}
          sub={s ? `${s.published} published` : undefined}
          to="/admin/projects"
        />
        <Stat
          label="Featured on home"
          value={s?.featured}
          sub="published + featured"
          to="/admin/projects"
        />
        <Stat
          label="Inquiries"
          value={s?.inquiries}
          sub={s ? `${s.unread} new` : undefined}
          to="/admin/inquiries"
          highlight={!!s?.unread}
        />
        <Stat label="Site settings" value="→" sub="hero, contact, SEO" to="/admin/settings" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-mist bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Latest inquiries</h2>
          {s?.latest.length ? (
            <ul className="mt-3 divide-y divide-mist">
              {s.latest.map((q) => (
                <li key={q.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink">
                      {q.name}{" "}
                      {q.status === "new" && (
                        <span className="ml-1 rounded-full bg-radic-red px-2 py-0.5 text-[10px] font-semibold text-white">
                          NEW
                        </span>
                      )}
                    </p>
                    <span className="font-mono text-xs text-graphite">
                      {formatDate(q.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-graphite">{q.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-graphite">No inquiries yet.</p>
          )}
          <Link
            to="/admin/inquiries"
            className="mt-3 inline-block text-sm text-radic-red hover:underline"
          >
            Open inbox →
          </Link>
        </section>

        <section className="rounded-xl border border-mist bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Quick guide</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-graphite">
            <li>
              <Link to="/admin/projects" className="text-ink hover:underline">
                Projects
              </Link>
              : add work, upload a cover and gallery, turn on <b>Published</b> and <b>Featured</b>{" "}
              to show it on the home page.
            </li>
            <li>
              <Link to="/admin/settings" className="text-ink hover:underline">
                Site settings
              </Link>
              : hero text, email, phone, WhatsApp, about story and SEO.
            </li>
            <li>
              <Link to="/admin/socials" className="text-ink hover:underline">
                Social links
              </Link>
              : paste your X, Facebook, Instagram URLs and switch them on.
            </li>
            <li>
              <Link to="/admin/pricing" className="text-ink hover:underline">
                Pricing
              </Link>
              : edit packages, or hide the whole pricing section from Site settings.
            </li>
          </ol>
          <p className="mt-4 text-xs text-graphite">
            Changes go live as soon as you save; the public site may take up to a minute to refresh.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  to,
  highlight,
}: {
  label: string;
  value: number | string | undefined;
  sub?: string;
  to: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`rounded-xl border bg-white p-5 transition-colors hover:border-radic-red/50 ${highlight ? "border-radic-red" : "border-mist"}`}
    >
      <p className="text-xs font-medium tracking-wide text-graphite uppercase">{label}</p>
      <p className="font-display mt-2 text-3xl font-semibold text-ink">{value ?? "…"}</p>
      {sub && <p className="mt-1 text-xs text-graphite">{sub}</p>}
    </Link>
  );
}
