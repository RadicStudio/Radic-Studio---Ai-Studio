import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getSupabase, mediaUrl } from "./supabase";

/** Current Supabase auth session (browser only). `undefined` = still loading. */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

export async function isAdminUser(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("is_admin");
  return !error && data === true;
}

/** Resize + compress an image in the browser, then upload it to the media bucket. Returns the public URL. */
export async function uploadImage(file: File, folder = "uploads", maxSide = 2000): Promise<string> {
  const blob = await compressImage(file, maxSide);
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await getSupabase()
    .storage.from("media")
    .upload(name, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return mediaUrl(name);
}

async function compressImage(file: File, maxSide: number): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif")
    return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  // WebP keeps transparency, so PNGs (often 2–3 MB exports) are converted too.
  // Browsers that cannot encode WebP hand back a PNG, which the caller names correctly.
  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
  if (!out) return file;
  // Keep the original if compression did not help (e.g. tiny PNG logos).
  return out.size < file.size || scale < 1 ? out : file;
}

/* ---------- Generic table helpers (used by the admin list pages) ---------- */

export type Row = { id: string; sort_order?: number } & Record<string, unknown>;

export function useRows<T extends Row>(table: string, order = "sort_order") {
  return useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from(table)
        .select("*")
        .order(order, { ascending: order !== "created_at" });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useSaveRow<T extends Row>(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<T> & { id?: string }) => {
      const sb = getSupabase();
      const { id, ...rest } = row as Record<string, unknown> & { id?: string };
      if (id) {
        const { error } = await sb
          .from(table)
          .update(rest as never)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await sb
        .from(table)
        .insert(rest as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", table] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });
}

export function useDeleteRow(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", table] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete"),
  });
}

/** Persist a new order: writes sort_order = index for every row. */
export function useReorder(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const sb = getSupabase();
      await Promise.all(ids.map((id, i) => sb.from(table).update({ sort_order: i }).eq("id", id)));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", table] }),
    onError: (e: Error) => toast.error(e.message || "Could not reorder"),
  });
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item === undefined) return list;
  next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
  return next;
}
