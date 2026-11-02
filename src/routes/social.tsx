import { createFileRoute } from "@tanstack/react-router";

import { AdLanding, loadLanding, type LandingConfig } from "@/components/site/AdLanding";
import { absoluteUrl } from "@/lib/supabase";
import { seo } from "@/lib/seo";

const CONFIG: LandingConfig = {
  kind: "social",
  category: "social-media",
  eyebrow: "Social media content",
  headline: "A feed that sells,",
  serif: "every month.",
  subline:
    "A monthly set of posts and stories in your brand, planned with you and delivered on schedule. Pause any month.",
  includes: [
    "A content plan agreed with you each month",
    "Posts and stories designed in your brand",
    "Delivered on schedule, ready to post",
    "Pause any month",
    "Editable files you own once paid",
  ],
  whatsappText:
    "Hi Radic Studio, I saw your ad. I'd like a price for monthly social media content.",
  workTitle: "Feeds we design.",
};

export const Route = createFileRoute("/social")({
  loader: () => loadLanding(CONFIG.category),
  staleTime: 60_000,
  head: ({ loaderData }) =>
    seo(
      "/social",
      "Social Media Design for Nigerian Businesses — From ₦120k/month",
      "A monthly set of posts and stories in your brand, planned with you and ready to post. Social media content design from ₦120,000 a month. Pause any month.",
      loaderData?.work[0]?.cover_url,
    ),
  component: SocialLanding,
});

function SocialLanding() {
  const { services, work, faqs } = Route.useLoaderData();
  return <AdLanding config={CONFIG} services={services} work={work} faqs={faqs} />;
}
