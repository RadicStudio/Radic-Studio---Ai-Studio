import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowLeftRight, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { describeWork } from "@/lib/ai";

import {
  ImageField,
  MultiImageUpload,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
} from "@/components/admin/Fields";
import { PageHeader } from "@/components/admin/Shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { moveItem, useRows } from "@/lib/admin";
import { slugify } from "@/lib/format";
import { absoluteUrl, getSupabase } from "@/lib/supabase";
import type { Category, Project, ProjectImage, Tool } from "@/lib/types";

export const Route = createFileRoute("/admin/projects/$id")({
  component: ProjectEditor,
});

type Draft = Omit<Project, "id" | "created_at" | "updated_at" | "category">;

const EMPTY: Draft = {
  title: "",
  slug: "",
  category_id: null,
  client: "",
  year: new Date().getFullYear(),
  tools: [],
  summary: "",
  description: "",
  cover_url: null,
  cover_alt: "",
  is_featured: false,
  is_published: false,
  sort_order: 0,
};

function ProjectEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const categories = useRows<Category & Record<string, unknown>>("categories");
  const toolRows = useRows<Tool & Record<string, unknown>>("tools");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const project = useQuery({
    queryKey: ["admin", "project", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Project;
    },
  });

  const images = useQuery({
    queryKey: ["admin", "project_images", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data } = await getSupabase()
        .from("project_images")
        .select("*")
        .eq("project_id", id)
        .order("sort_order");
      return (data ?? []) as ProjectImage[];
    },
  });

  useEffect(() => {
    if (project.data) {
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = project.data;
      setDraft({ ...rest, tools: rest.tools ?? [] });
      setSlugTouched(true);
    }
  }, [project.data]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.title.trim()) throw new Error("Give the project a title");
      const payload = {
        ...draft,
        slug: slugify(draft.slug || draft.title),
        year: draft.year ? Number(draft.year) : null,
      };
      const sb = getSupabase();
      if (isNew) {
        const { count } = await sb.from("projects").select("id", { count: "exact", head: true });
        const { data, error } = await sb
          .from("projects")
          .insert({ ...payload, sort_order: count ?? 0 })
          .select("id")
          .single();
        if (error) throw error;
        return (data as { id: string }).id;
      }
      const { error } = await sb.from("projects").update(payload).eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Project saved");
      if (isNew) navigate({ to: "/admin/projects/$id", params: { id: newId } });
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "That URL slug is already used by another project"
          : e.message,
      ),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await getSupabase().from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Project deleted");
      navigate({ to: "/admin/projects" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addImages = useMutation({
    mutationFn: async (urls: string[]) => {
      const start = images.data?.length ?? 0;
      const { error } = await getSupabase()
        .from("project_images")
        .insert(urls.map((url, i) => ({ project_id: id, url, sort_order: start + i })));
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "project_images", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateImage = useMutation({
    mutationFn: async (im: Partial<ProjectImage> & { id: string }) => {
      const { id: imId, ...rest } = im;
      const { error } = await getSupabase().from("project_images").update(rest).eq("id", imId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "project_images", id] }),
  });

  const removeImage = useMutation({
    mutationFn: async (imId: string) => {
      const { error } = await getSupabase().from("project_images").delete().eq("id", imId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "project_images", id] }),
  });

  const reorderImages = useMutation({
    mutationFn: async (ordered: ProjectImage[]) => {
      const sb = getSupabase();
      await Promise.all(
        ordered.map((im, i) => sb.from("project_images").update({ sort_order: i }).eq("id", im.id)),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "project_images", id] }),
  });

  if (!isNew && project.isLoading) return <p className="text-sm text-graphite">Loading…</p>;
  if (!isNew && project.isError)
    return <p className="text-sm text-destructive">Project not found.</p>;

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/projects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-graphite hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      <PageHeader
        title={isNew ? "New project" : draft.title || "Edit project"}
        action={
          <div className="flex gap-2">
            {!isNew && (
              <Button
                variant="outline"
                onClick={() => setConfirm(true)}
                className="text-destructive"
              >
                <Trash2 /> Delete
              </Button>
            )}
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <TextField
            label="Title"
            value={draft.title}
            onChange={(v) => set({ title: v, ...(slugTouched ? {} : { slug: slugify(v) }) })}
          />
          <TextField
            label="URL slug"
            value={draft.slug}
            hint={`The page will live at /work/${slugify(draft.slug || draft.title) || "…"}`}
            onChange={(v) => {
              setSlugTouched(true);
              set({ slug: v });
            }}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="Category"
              value={draft.category_id ?? ""}
              onChange={(v) => set({ category_id: v || null })}
              options={[
                { value: "", label: "— none —" },
                ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <TextField label="Client" value={draft.client} onChange={(v) => set({ client: v })} />
            <TextField
              label="Year"
              type="number"
              value={draft.year}
              onChange={(v) => set({ year: v ? Number(v) : null })}
            />
          </div>
          <TextAreaField
            label="Summary"
            rows={2}
            value={draft.summary}
            onChange={(v) => set({ summary: v })}
            hint="One or two sentences shown under the title and on cards."
          />
          <TextAreaField
            label="Description"
            rows={10}
            value={draft.description}
            onChange={(v) => set({ description: v })}
            hint="Markdown works: ## headings, **bold**, lists, links."
          />
          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-wide text-graphite uppercase">Tools used</p>
            <div className="flex flex-wrap gap-2">
              {(toolRows.data ?? []).map((t) => {
                const on = draft.tools.some((x) => x.toLowerCase() === t.name.toLowerCase());
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      set({
                        tools: on
                          ? draft.tools.filter((x) => x.toLowerCase() !== t.name.toLowerCase())
                          : [...draft.tools, t.name],
                      })
                    }
                    className={
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors " +
                      (on
                        ? "border-radic-red bg-radic-red-tint text-radic-red-dark"
                        : "border-mist bg-white text-graphite hover:border-ink")
                    }
                  >
                    {t.icon_url && (
                      <img src={t.icon_url} alt="" className="h-4 w-4 object-contain" />
                    )}
                    {t.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-graphite">Manage the list and upload icons under Tools.</p>
          </div>
        </div>

        <div className="space-y-4">
          <ImageField
            label="Cover image"
            value={draft.cover_url}
            onChange={(url) => set({ cover_url: url })}
            folder="projects"
            hint="Shown on cards and at the top of the project page."
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!draft.cover_url || aiBusy}
            onClick={async () => {
              if (!draft.cover_url) return;
              setAiBusy(true);
              try {
                const hints = [
                  draft.title && `title: ${draft.title}`,
                  draft.client && `client: ${draft.client}`,
                  draft.year && `year: ${draft.year}`,
                ]
                  .filter(Boolean)
                  .join("; ");
                const out = await describeWork(absoluteUrl(draft.cover_url), hints);
                set({
                  title: draft.title || out.title,
                  summary: draft.summary || out.summary,
                  description: draft.description || out.description,
                  cover_alt: draft.cover_alt || out.alt,
                });
                if (!slugTouched && !draft.title) set({ slug: slugify(out.title) });
                toast.success("Draft written — read it over and edit before saving");
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setAiBusy(false);
              }
            }}
          >
            <Sparkles /> {aiBusy ? "Writing…" : "Write title, summary & description from the cover"}
          </Button>
          <TextField
            label="Cover alt text"
            value={draft.cover_alt}
            onChange={(v) => set({ cover_alt: v })}
            hint="Describe the image for accessibility and search."
          />
          <SwitchField
            label="Published"
            checked={draft.is_published}
            onChange={(v) => set({ is_published: v })}
            hint="Visible on the Work page"
          />
          <SwitchField
            label="Featured"
            checked={draft.is_featured}
            onChange={(v) => set({ is_featured: v })}
            hint="Also shown on the home page"
          />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Gallery</h2>
        {isNew ? (
          <p className="mt-2 text-sm text-graphite">
            Save the project first, then add gallery images.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <MultiImageUpload
              folder={`projects/${id}`}
              onUploaded={(urls) => addImages.mutate(urls)}
            />
            {(images.data ?? []).length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(images.data ?? []).map((im, i, all) => (
                  <li
                    key={im.id}
                    className="overflow-hidden rounded-lg border border-mist bg-white"
                  >
                    <img
                      src={im.url}
                      alt={im.alt ?? ""}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="space-y-2 p-2">
                      <input
                        defaultValue={im.caption ?? ""}
                        placeholder="Caption (optional)"
                        className="w-full rounded-md border border-mist px-2 py-1 text-xs"
                        onBlur={(e) =>
                          e.target.value !== (im.caption ?? "") &&
                          updateImage.mutate({ id: im.id, caption: e.target.value })
                        }
                      />
                      <input
                        defaultValue={im.alt ?? ""}
                        placeholder="Alt text"
                        className="w-full rounded-md border border-mist px-2 py-1 text-xs"
                        onBlur={(e) =>
                          e.target.value !== (im.alt ?? "") &&
                          updateImage.mutate({ id: im.id, alt: e.target.value })
                        }
                      />
                      <div className="flex justify-between">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={i === 0}
                            onClick={() => reorderImages.mutate(moveItem(all, i, i - 1))}
                            aria-label="Move earlier"
                          >
                            <ArrowLeftRight className="rotate-180" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={i === all.length - 1}
                            onClick={() => reorderImages.mutate(moveItem(all, i, i + 1))}
                            aria-label="Move later"
                          >
                            <ArrowLeftRight />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeImage.mutate(im.id)}
                          aria-label="Remove image"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              Its gallery images are removed with it. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => remove.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
