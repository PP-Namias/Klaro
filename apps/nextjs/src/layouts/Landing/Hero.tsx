"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useLanguage } from "~/providers/language-provider";
import styles from "../../app/page.module.css";
import { HeroBg } from "../../components/HeroBg";

export function Hero() {
  const { t } = useLanguage();
  return (
    <section className={`${styles.heroSection} relative overflow-hidden`}>
      <HeroBg />
      <div className="pointer-events-none absolute -bottom-80 left-1/2 z-0 h-auto w-[1920px] -translate-x-1/2 opacity-90">
        <Image
          src="/showcase-bg.svg"
          alt="Showcase Background"
          width={1920}
          height={600}
          className="h-auto w-full"
          priority
        />
      </div>
      <motion.div
        className={styles.heroContent}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className={styles.heroTitle}>
          {t("hero.title1")}
          <br className="hidden md:block" /> {t("hero.title2")}
        </h1>
        <h2 className={styles.heroSubheading}>{t("hero.subtitle1")}</h2>
        <p className={styles.heroSubtitle}>
          {t("hero.subtitle2")} <br className="hidden md:block" />
          {t("hero.subtitle3")}
        </p>
        <div className={styles.heroButtons}>
          <Link
            href="/scan"
            className={styles.btnBlack}
            aria-label={t("btn.startAScan")}
          >
            {t("btn.startAScan")} <ArrowRight size={16} className="ml-2" />
          </Link>
          <Link href="/scan" className={styles.btnOutline}>
            {t("btn.learnMore")}
          </Link>
        </div>
      </motion.div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-[1400px] -translate-y-6 px-0 md:px-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      >
        <div className="relative w-full">
          <Image
            src="/klaro-showcase.png"
            alt="Klaro Showcase"
            width={1920}
            height={1200}
            className="h-auto w-full object-contain"
            priority
            quality={85}
          />
        </div>
      </motion.div>
    </section>
  );
}
