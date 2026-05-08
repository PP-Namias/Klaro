import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMarketingPageContent } from "~/content/marketing-pages";
import { MarketingPage } from "~/layouts/Landing/MarketingPage";

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const content = getMarketingPageContent(params.slug);

  if (!content) {
    return {
      title: "Klaro",
      description: "Medical guidance that feels clearer and calmer.",
    };
  }

  return {
    title: `${content.eyebrow} | Klaro`,
    description: content.description,
  };
}

export default function MarketingRoutePage({ params }: PageProps) {
  const content = getMarketingPageContent(params.slug);

  if (!content) {
    notFound();
  }

  return <MarketingPage content={content} />;
}