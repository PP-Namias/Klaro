import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMarketingPageContent } from "~/content/marketing-pages";
import { MarketingPage } from "~/layouts/Landing/MarketingPage";

interface PageProps {
  readonly params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = getMarketingPageContent(slug);

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

export default async function MarketingRoutePage({ params }: PageProps) {
  const { slug } = await params;
  const content = getMarketingPageContent(slug);

  if (!content) {
    notFound();
  }

  return <MarketingPage content={content} />;
}
