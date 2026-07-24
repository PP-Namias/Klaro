"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Security() {
  return (
    <motion.section
      className="-mt-4 flex w-full flex-col"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <h2 className="section-header mb-16 text-left text-zinc-900">
        Secure by Design
      </h2>
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 lg:gap-24">
        <div className="flex w-full justify-center md:justify-end md:pr-20">
          <Image
            src="/sections/security/1.png"
            alt="Medical-grade vault"
            width={500}
            height={500}
            className="h-auto w-full max-w-[400px] object-contain"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="showcase-heading mb-6 text-zinc-900">
            Medical-grade privacy
          </h3>
          <p className="showcase-body mb-24 max-w-[90%] text-zinc-500">
            Your health data belongs to you. Every document is encrypted with
            AES-256 standards, the same used by banks. We comply with the Data
            Privacy Act to ensure your medical history stays in your hands only.
          </p>
          <a
            href="#"
            className="font-geist group flex items-center gap-3 text-[1.32rem] font-medium text-zinc-900 transition-colors hover:text-zinc-600"
          >
            How we protect you{" "}
            <ArrowRight className="h-5 w-5 translate-y-[1px] text-zinc-400 transition-colors group-hover:text-zinc-600" />
          </a>
        </div>
      </div>
    </motion.section>
  );
}
