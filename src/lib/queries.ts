import { getSupabase } from "./supabase";
import {
  DEFAULT_SETTINGS,
  type Category,
  type Faq,
  type ClientLogo,
  type PricingTier,
  type Project,
  type ProjectImage,
  type Service,
  type SiteSettings,
  type Tool,
  type SocialLink,
  type Testimonial,
} from "./types";

const PROJECT_SELECT = "*, category:categories(*)";

export async function fetchSettings(): Promise<SiteSettings> {
  const { data } = await getSupabase().from("site_settings").select("*").eq("id", 1).maybeSingle();
  return (data as SiteSettings | null) ?? DEFAULT_SETTINGS;
}

export async function fetchSocials(): Promise<SocialLink[]> {
  const { data } = await getSupabase()
    .from("social_links")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as SocialLink[] | null) ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await getSupabase().from("categories").select("*").order("sort_order");
  return (data as Category[] | null) ?? [];
}

export async function fetchProjects(
  opts: { featured?: boolean; limit?: number } = {},
): Promise<Project[]> {
  let q = getSupabase()
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("is_published", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q;
  return (data as Project[] | null) ?? [];
}

export async function fetchProject(slug: string): Promise<{
  project: Project;
  images: ProjectImage[];
  prev: Project | null;
  next: Project | null;
  tools: Tool[];
} | null> {
  // One round trip: the project with its images, alongside the list (for prev/next) and tools.
  // These used to run one after another, so a project page waited on three requests in a row.
  const [{ data: project }, all, tools] = await Promise.all([
    getSupabase()
      .from("projects")
      .select(`${PROJECT_SELECT}, images:project_images(*)`)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle(),
    fetchProjects(),
    fetchTools(),
  ]);
  if (!project) return null;
  const { images: rawImages, ...rest } = project as Project & { images?: ProjectImage[] | null };
  const images = [...(rawImages ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const idx = all.findIndex((p) => p.id === project.id);
  const prev = idx > 0 ? (all[idx - 1] ?? null) : null;
  const next = idx >= 0 && idx < all.length - 1 ? (all[idx + 1] ?? null) : null;
  return {
    project: rest as Project,
    images,
    prev,
    next,
    tools,
  };
}

export async function fetchTools(): Promise<Tool[]> {
  const { data } = await getSupabase()
    .from("tools")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as Tool[] | null) ?? [];
}

export async function fetchServices(): Promise<Service[]> {
  const { data } = await getSupabase()
    .from("services")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as Service[] | null) ?? [];
}

export async function fetchFaqs(): Promise<Faq[]> {
  const { data } = await getSupabase()
    .from("faqs")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as Faq[] | null) ?? [];
}

export async function fetchPricing(): Promise<PricingTier[]> {
  const { data } = await getSupabase()
    .from("pricing_tiers")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as PricingTier[] | null) ?? [];
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data } = await getSupabase()
    .from("testimonials")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as Testimonial[] | null) ?? [];
}

export async function fetchClientLogos(): Promise<ClientLogo[]> {
  const { data } = await getSupabase()
    .from("client_logos")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");
  return (data as ClientLogo[] | null) ?? [];
}

/** Shared data every public page needs (header, footer, SEO). */
export async function fetchSiteShell() {
  const [settings, socials] = await Promise.all([fetchSettings(), fetchSocials()]);
  return { settings, socials };
}
