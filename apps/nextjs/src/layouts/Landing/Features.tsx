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
          {/* Decorations - positioned outside the overflow-hidden card */}
          <div className="pointer-events-none absolute top-[10%] left-[40%] z-20 h-[260px] w-[480px] -translate-x-1/2">
            <Image
              src="/sections/clarify/arrow.png"
              alt=""
              fill
              className="object-contain"
              quality={100}
            />
          </div>

          <div className="pointer-events-none absolute top-[80%] left-[38%] z-20 h-[160px] w-[160px] -translate-x-1/2">
            <Image
              src="/sections/clarify/star.png"
              alt=""
              fill
              className="object-contain"
              quality={100}
            />
          </div>

          <div className="group relative flex min-h-[400px] flex-col overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_16px_0_rgba(0,0,0,0.05)] md:flex-row md:gap-[1.5rem]">
            <div className="z-10 flex flex-1 flex-col justify-between py-[0.5rem]">
              <div className="max-w-xl">
                <h3 className="feature-card-title mb-4 text-black">Learn</h3>
                <p className="feature-card-description max-w-[400px] text-[#8C8C8C]">
                  AI explains what "High Creatinine" actually means for you.
                </p>
              </div>
              <Link
                href="/login?auto=1"
                className="feature-card-description mt-8 inline-flex items-center gap-2 font-medium text-black transition-all group-hover:translate-x-1"
              >
                Try it out{" "}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="relative min-h-[300px] flex-1 md:min-h-full">
              {/* Main graphic */}
              <div className="relative left-[-40px] h-full w-full">
                <Image
                  src="/sections/clarify/1.png"
                  alt="Learn visualization"
                  fill
                  className="object-contain object-right"
                  quality={100}
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Feature Card 1 */}
        <div className="group flex flex-col gap-[1.5rem] overflow-hidden rounded-[24px] border border-[#eeeeee] bg-white p-[1.5rem] shadow-[0_4px_8px_0_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_16px_0_rgba(0,0,0,0.05)]">
          <div>
            <h3 className="feature-card-title mb-4 text-black">Analyze</h3>
            <p className="feature-card-description text-[#8C8C8C]">
              Upload any medical document and get a structured breakdown of the
              most critical values.
            </p>
          </div>
          <div className="relative h-80 w-full">
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
          <div>
            <h3 className="feature-card-title mb-4 text-black">Track</h3>
            <p className="feature-card-description text-[#8C8C8C]">
              Monitor your health journey with intuitive visualizations that
              make data easy to understand.
            </p>
          </div>
          <div className="relative h-80 w-full">
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
