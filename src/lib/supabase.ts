import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase connection.
 * The URL and publishable key are safe to ship to the browser: all data access
 * is governed by row-level security in the database (see supabase/migrations).
 * Override with VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY if you ever
 * move to a different project.
 */
export const SUPABASE_URL =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ??
  "https://lvfbvjdxwlnpivxrsmmi.supabase.co";

export const SUPABASE_KEY =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  "sb_publishable_aUUQDlneknmWujtsB2VIzg_weVEKLWI";

/** Public address of the site, used for absolute share-image and canonical URLs. */
export const SITE_URL = (
  (import.meta.env["VITE_SITE_URL"] as string | undefined) ?? "https://radicstudio.lovable.app"
).replace(/\/$/, "");

export function absoluteUrl(path: string | null | undefined): string {
  if (!path) return SITE_URL;
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const isBrowser = typeof window !== "undefined";

let browserClient: SupabaseClient | undefined;

/** A client that persists the admin session in the browser; a stateless one on the server. */
export function getSupabase(): SupabaseClient {
  if (!isBrowser) {
    return createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return browserClient;
}

/** Public URL for a file in the `media` storage bucket. */
export function mediaUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
