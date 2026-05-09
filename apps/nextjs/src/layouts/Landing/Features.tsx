import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Features() {
  return (
    <section className="mt-[100px] flex flex-col gap-[2.5rem]">
      <h2 className="section-header w-full text-center tracking-[0px] text-black">
        How Klaro helps Clarify your Health
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Main Feature Card - Wide */}
        <div className="relative md:col-span-2">
          {/* Decorations - hidden on mobile to prevent viewport bleed */}
          <div className="pointer-events-none absolute top-[10%] left-[40%] z-20 hidden h-[260px] w-[480px] -translate-x-1/2 md:block">
            <Image
              src="/sections/clarify/arrow.png"
              alt=""
              fill
              className="object-contain"
              quality={100}
            />
          </div>

          <div className="pointer-events-none absolute top-[80%] left-[38%] z-20 hidden h-[160px] w-[160px] -translate-x-1/2 md:block">
            <Image
              src="/sections/clarify/star.png"
              alt=""
              fill
              className="object-contain"
              quality={100}
            />
          </div>

          <div className="group relative flex min-h-[400px] flex-col overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_16px_0_rgba(0,0,0,0.05)]">
            
            {/* Nested wrapper splits text and image side-by-side on desktop */}
            <div className="flex flex-1 flex-col md:flex-row md:gap-[1.5rem]">
              <div className="z-10 flex flex-1 flex-col py-[0.5rem] text-center md:text-left">
                <div className="mx-auto max-w-xl md:mx-0">
                  <h3 className="feature-card-title mb-4 text-black">Uncover</h3>
                  <p className="feature-card-description mx-auto max-w-[400px] text-[#8C8C8C] md:mx-0">
                    Clara will explain what "High Creatinine" actually means for you.
                  </p>
                </div>
              </div>

              <div className="relative min-h-[300px] w-full flex-1 md:min-h-full">
                {/* Main graphic: responsive object fit and margin fix */}
                <div className="absolute inset-0 md:left-[-40px]">
                  <Image
                    src="/sections/clarify/1.png"
                    alt="Learn visualization"
                    fill
                    className="object-contain object-center md:object-right"
                    quality={100}
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Button sits at the absolute bottom of the DOM, below the image */}
            <div className="mt-4 flex w-full justify-center md:mt-0 md:justify-start">
              <Link
                href="/scan"
                className="feature-card-description inline-flex items-center gap-2 font-medium text-black transition-all group-hover:translate-x-1"
              >
                Try it out{" "}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            
          </div>
        </div>

        {/* Secondary Feature Card 1 */}
        <div className="group flex flex-col gap-[1.5rem] overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_16px_0_rgba(0,0,0,0.05)]">
          <div className="text-center md:text-left">
            <h3 className="feature-card-title mb-4 text-black">Analyze</h3>
            <p className="feature-card-description text-[#8C8C8C]">
              Upload any medical document and get a structured breakdown of the
              most critical values.
            </p>
          </div>
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/sections/clarify/2.png"
              alt="Analyze visualization"
              fill
              className="object-contain object-center"
              quality={100}
            />
          </div>
        </div>

        {/* Secondary Feature Card 2 */}
        <div className="group flex flex-col gap-[1.5rem] overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_16px_0_rgba(0,0,0,0.05)]">
          <div className="text-center md:text-left">
            <h3 className="feature-card-title mb-4 text-black">Track</h3>
            <p className="feature-card-description text-[#8C8C8C]">
              Monitor your health journey with intuitive visualizations that
              make data easy to understand.
            </p>
          </div>
          <div className="relative h-64 w-full md:h-80">
            <Image
              src="/sections/clarify/3.png"
              alt="Track visualization"
              fill
              className="object-contain object-bottom"
              quality={100}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
