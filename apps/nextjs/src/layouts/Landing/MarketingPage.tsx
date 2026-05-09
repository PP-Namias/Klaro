import Link from "next/link";

import type { MarketingPageContent } from "~/content/marketing-pages";

import { Footer } from "~/layouts/Landing/Footer";
import { Navbar } from "~/layouts/Landing/Navbar";

interface MarketingPageProps {
  content: MarketingPageContent;
}

export function MarketingPage({ content }: MarketingPageProps) {
  return (
    <div className="overflow-x-hidden bg-[#f9fafb]">
      <Navbar theme="light" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-20 px-6 pb-20 pt-32 md:px-8 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-1 text-[0.7rem] uppercase tracking-[0.28em] text-zinc-500">
              {content.eyebrow}
            </p>
            <h1 className="section-header max-w-4xl text-balance text-black">
              {content.title}
            </h1>
            <p className="feature-card-description max-w-2xl text-zinc-600">
              {content.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={content.primaryAction.href}
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                {content.primaryAction.label}
              </Link>
              <Link
                href={content.secondaryAction.href}
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
              >
                {content.secondaryAction.label}
              </Link>
            </div>
          </div>

          {/* Soft removal of the stats section
          <div className="grid gap-4 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            {content.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-[20px] border border-zinc-100 bg-zinc-50 px-5 py-4"
              >
                <span className="feature-small-title text-zinc-500">
                  {stat.label}
                </span>
                <span className="feature-card-title text-zinc-950">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
          */}
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="feature-small-title text-zinc-500">What this page covers</p>
              <h2 className="section-header text-black">Useful details, not filler.</h2>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {content.cards.map((card) => (
              <article
                key={card.title}
                className="flex h-full flex-col gap-4 rounded-[24px] border border-zinc-200 bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
              >
                <h3 className="feature-card-title text-black">{card.title}</h3>
                <p className="feature-card-description text-zinc-600">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-zinc-200 bg-[#0b0f14] px-6 py-8 text-white shadow-[0_16px_40px_rgba(0,0,0,0.08)] md:px-8 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="feature-small-title text-white/65">Next step</p>
              <h2 className="section-header text-white">{content.closingTitle}</h2>
              <p className="feature-card-description text-white/70">
                {content.closingBody}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={content.primaryAction.href}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition-transform hover:-translate-y-0.5"
              >
                {content.primaryAction.label}
              </Link>
              <Link
                href={content.secondaryAction.href}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                {content.secondaryAction.label}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}