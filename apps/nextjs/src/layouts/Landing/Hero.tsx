import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import styles from "../../app/page.module.css";
import { HeroBg } from "../../components/HeroBg";
import { HeroBgTwo } from "../../components/HeroBgTwo";

export function Hero() {
  return (
    <section className={`${styles.heroSection} relative overflow-hidden`}>
      <HeroBg />
      {/* <HeroBgTwo /> */}
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
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Precision Insights for
          <br /> Medical Results
        </h1>
        <h2 className={styles.heroSubheading}>It shouldn’t be confusing.</h2>
        <p className={styles.heroSubtitle}>
          Upload your medical results and get clear explanations
          <br />
          so you know what to do next
        </p>
        <div className={styles.heroButtons}>
          <Link href="/scan" className={styles.btnBlack}>
            Get Started <ArrowRight size={16} className="ml-2" />
          </Link>
          <button className={styles.btnOutline}>Learn More</button>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] -translate-y-6 px-8">
        <Image
          src="/klaro-showcase.png"
          alt="Klaro Showcase"
          width={1920}
          height={1200}
          className="h-auto w-full"
          priority
          quality={100}
        />
      </div>
    </section>
  );
}
