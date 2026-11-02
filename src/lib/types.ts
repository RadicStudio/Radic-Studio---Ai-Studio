export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  client: string | null;
  year: number | null;
  tools: string[];
  summary: string | null;
  description: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
};

export type ProjectImage = {
  id: string;
  project_id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  sort_order: number;
};

export const SERVICE_KINDS = [
  "uiux",
  "brand",
  "event",
  "social",
  "print",
  "illustration",
  "motion",
  "other",
] as const;
export type ServiceKind = (typeof SERVICE_KINDS)[number];

export type Service = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_visible: boolean;
  kind: ServiceKind;
  /** Public "from" price in naira; null = quoted per project. */
  price_from: number | null;
  /** Upper end of a typical project, used by the quote flow. */
  price_to: number | null;
  price_note: string | null;
  turnaround: string | null;
  concepts: number | null;
  revisions: number | null;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
};

export type PricingTier = {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  period: string | null;
  features: string[];
  is_highlighted: boolean;
  is_visible: boolean;
  sort_order: number;
};

export type Testimonial = {
  id: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  company: string | null;
  avatar_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type ClientLogo = {
  id: string;
  name: string;
  logo_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

export const SOCIAL_PLATFORMS = [
  "x",
  "facebook",
  "instagram",
  "linkedin",
  "behance",
  "dribbble",
  "tiktok",
  "youtube",
  "threads",
  "pinterest",
  "other",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  label: string | null;
  url: string;
  sort_order: number;
  is_visible: boolean;
};

export type Tool = {
  id: string;
  name: string;
  icon_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  budget_range: string | null;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
  source: string;
  brief: Record<string, string> | null;
};

export type QuoteItem = {
  description: string;
  detail?: string;
  qty: number;
  unit_price: number;
};

export const QUOTE_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "signed",
  "paid",
  "declined",
  "expired",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** What a client sees on the quote page (returned by the get_quote database function). */
export type PublicQuote = {
  number: string;
  status: QuoteStatus;
  client_name: string;
  client_business: string | null;
  client_email: string | null;
  project_title: string;
  summary: string | null;
  items: QuoteItem[];
  discount: number;
  timeline: string | null;
  revisions: number;
  deposit_percent: number;
  valid_until: string | null;
  payment_link: string | null;
  notes: string | null;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signature_kind: "typed" | "drawn" | null;
  signature_data: string | null;
  studio_signer: string;
  paid_at: string | null;
  certificate_number: string | null;
  certificate_issued_at: string | null;
  deliverables_note: string | null;
};

/** The full row the studio works with in the admin. */
export type Quote = PublicQuote & {
  id: string;
  token: string;
  inquiry_id: string | null;
  client_phone: string | null;
  internal_notes: string | null;
  viewed_at: string | null;
  signer_email: string | null;
  signer_ip: string | null;
  signer_agent: string | null;
  updated_at: string;
};

export type ProcessStep = { title: string; text: string };

export type SiteSettings = {
  id: number;
  studio_name: string;
  tagline: string;
  hero_headline: string;
  hero_subline: string | null;
  hero_cta_text: string | null;
  hero_cta_url: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  about_story: string | null;
  process_steps: ProcessStep[];
  footer_note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  show_pricing: boolean;
  availability_text: string | null;
  reply_promise: string | null;
  ai_statement: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  meta_pixel_id: string | null;
  ga_measurement_id: string | null;
  updated_at: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  studio_name: "Radic Studio",
  tagline: "lux . radix . creatio",
  hero_headline: "We draw brands from the root.",
  hero_subline: null,
  hero_cta_text: "See our work",
  hero_cta_url: "/work",
  email: "radic.studio@gmail.com",
  phone: "08133037674",
  whatsapp_number: "2348133037674",
  address: null,
  about_story: null,
  process_steps: [],
  footer_note: null,
  seo_title: "Radic Studio",
  seo_description:
    "Graphic design portfolio, brand identity showcase, quote builder, and client management system for Radic Studio.",
  og_image_url: null,
  show_pricing: true,
  availability_text: null,
  reply_promise: null,
  ai_statement: null,
  bank_name: null,
  bank_account_name: null,
  bank_account_number: null,
  meta_pixel_id: null,
  ga_measurement_id: null,
  updated_at: "",
};
