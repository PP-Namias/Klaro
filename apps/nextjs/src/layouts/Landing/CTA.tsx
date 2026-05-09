import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import styles from "../../app/page.module.css";

export function CTA() {
  return (
    <section className="relative left-1/2 flex w-screen -translate-x-1/2 flex-col items-center overflow-hidden pt-16 pb-32 text-center">
      {/* full-width bg image pinned to bottom with top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[600px] md:h-[900px]"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 15%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%)",
        }}
      >
        <Image
          src="/sections/cta/cta-bg.png"
          alt=""
          fill
          className="object-cover object-bottom"
          quality={100}
          priority
        />
      </div>

      <div className="relative z-10 flex w-full max-w-[1400px] flex-col items-center px-6">
        <h2 className="cta-title mb-2 text-zinc-900">
          Clear results are just a scan away
        </h2>

        <div className="relative -mt-12 -mb-12 h-[350px] w-full max-w-[750px] md:-mt-24 md:-mb-24 md:h-[650px]">
          <Image
            src="/sections/cta/1.png"
            alt="Klaro App Preview"
            fill
            className="object-contain"
            quality={100}
          />
        </div>

        <p className="cta-description mb-8 max-w-[600px] text-zinc-900">
          Claim your clarity and be the first to decode your health jargon with us.
        </p>
        <div className="mb-8 flex flex-row gap-4">
          <Link href="/scan" className={styles.btnBlack}>
            Get Started <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
