# Radic Studio — portfolio website

Behance-style portfolio for **Radic Studio** (lux . radix . creatio) with a private studio panel at `/admin` where the owner edits everything visitors see: projects and images, services, pricing, testimonials, client logos, social links, contact details and SEO.

## How it is built

| Layer     | Choice                                                           |
| --------- | ---------------------------------------------------------------- |
| Front end | React 19 · TanStack Start (SSR) · Tailwind v4 · shadcn/ui        |
| Motion    | `motion` (Framer Motion) — the only animation library            |
| Backend   | Supabase: Postgres + Row Level Security, Auth, Storage (`media`) |
| Email     | Supabase edge function `notify-inquiry` → Resend                 |
| Hosting   | Lovable (this repo is synced two-way with the Lovable project)   |

Supabase project: `lvfbvjdxwlnpivxrsmmi` (region eu-west-3). The URL and publishable key live in `src/lib/supabase.ts`; they are public by design — all access is governed by RLS policies in `supabase/migrations`.

## Editing content

Sign in at `/admin` with the studio email. Content changes are live immediately (public pages cache for 60 s).

- **Projects** → add work, upload a cover and gallery, switch on _Published_ (Work page) and _Featured_ (home page).
- **Site settings** → hero text, email, phone, WhatsApp number, about story, process steps, SEO and share image.
- **Social links** → paste URLs for X, Facebook, Instagram, Behance… and switch them on.
- **Pricing** → packages in ₦; hide the whole section from Site settings if needed.
- **Inquiries** → contact-form messages; reply by email or WhatsApp.

## Contact-form emails

Deployed function: `supabase/functions/notify-inquiry`. It needs the secret `RESEND_API_KEY` (Supabase dashboard → Edge Functions → Secrets). Without it, messages are still saved to the Inquiries inbox; only the email notification is skipped.

## Development

```sh
bun install
bun run dev       # http://localhost:5173
bun run build     # production build (nitro / cloudflare preset, as Lovable deploys it)
bun run lint && npx tsc --noEmit
```

Routes are file-based under `src/routes/` (`work.$slug.tsx` → `/work/:slug`, `admin.*.tsx` → `/admin/*`). Brand assets are in `public/brand/`.

## Adding another admin

1. Supabase → Authentication → Users → _Add user_ (auto-confirm).
2. SQL editor: `insert into public.admins (email) values ('person@example.com');`
