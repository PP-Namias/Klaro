"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import styles from "../../app/page.module.css";

export function CTA() {
  return (
    <motion.section 
      className="relative left-1/2 flex w-screen -translate-x-1/2 flex-col items-center overflow-hidden pt-16 pb-32 text-center"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* full-width bg image pinned to bottom with top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[900px]"
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

        <div className="relative -mt-24 -mb-24 h-[650px] w-[750px]">
          <Image
            src="/sections/cta/1.png"
            alt="Klaro App Preview"
            fill
            className="object-contain"
            quality={100}
          />
        </div>

        <p className="cta-description mb-8 max-w-[600px] text-zinc-900">
          Join thousands of Filipinos decoding their health jargon.
          <br />
          Take control of your medical journey today.
        </p>
        <div className="mb-8 flex flex-row gap-4">
          <Link href="/scan" className={styles.btnBlack}>
            Start a scan <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
