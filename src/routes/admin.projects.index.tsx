import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Star } from "lucide-react";

import { PageHeader } from "@/components/admin/Shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { moveItem, useReorder, useRows, useSaveRow } from "@/lib/admin";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/projects/")({
  component: ProjectsList,
});

function ProjectsList() {
  const rows = useRows<Project & Record<string, unknown>>("projects");
  const save = useSaveRow<Project & Record<string, unknown>>("projects");
  const reorder = useReorder("projects");
  const list = rows.data ?? [];

  return (
    <div>
      <PageHeader
        title="Projects"
        text="Order here is the order on the site. Featured + published projects appear on the home page."
        action={
          <Button asChild>
            <Link to="/admin/projects/$id" params={{ id: "new" }}>
              <Plus /> New project
            </Link>
          </Button>
        }
      />
      {rows.isLoading ? (
        <p className="text-sm text-graphite">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mist bg-white p-10 text-center text-sm text-graphite">
          No projects yet. Add your first piece of work.
        </div>
      ) : (
        <ul className="divide-y divide-mist overflow-hidden rounded-xl border border-mist bg-white">
          {list.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-3 py-3 md:px-4",
                !p.is_published && "opacity-60",
              )}
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => reorder.mutate(moveItem(list, i, i - 1).map((r) => r.id))}
                  className="rounded p-1 text-graphite hover:bg-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={i === list.length - 1}
                  onClick={() => reorder.mutate(moveItem(list, i, i + 1).map((r) => r.id))}
                  className="rounded p-1 text-graphite hover:bg-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-mist">
                {p.cover_url && (
                  <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  to="/admin/projects/$id"
                  params={{ id: p.id }}
                  className="font-medium text-ink hover:underline"
                >
                  {p.title}
                </Link>
                <p className="font-mono truncate text-xs text-graphite">
                  {[p.client, p.year].filter(Boolean).join(" · ")} · /work/{p.slug}
                </p>
              </div>
              <label className="hidden items-center gap-2 text-xs text-graphite sm:flex">
                <Star
                  className={cn("h-4 w-4", p.is_featured ? "fill-radic-red text-radic-red" : "")}
                />
                <Switch
                  checked={p.is_featured}
                  onCheckedChange={(v) => save.mutate({ id: p.id, is_featured: v })}
                  aria-label="Featured"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-graphite">
                <span className="hidden sm:inline">Published</span>
                <Switch
                  checked={p.is_published}
                  onCheckedChange={(v) => save.mutate({ id: p.id, is_published: v })}
                  aria-label="Published"
                />
              </label>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/projects/$id" params={{ id: p.id }}>
                  Edit
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
