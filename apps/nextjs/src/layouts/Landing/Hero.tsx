import Image from "next/image";
import { ArrowRight } from "lucide-react";
import styles from "../../app/sample-landing/page.module.css";
import { HeroBg } from "../../components/HeroBg";
import { HeroBgTwo } from "../../components/HeroBgTwo";

export function Hero() {
  return (
  <section className={`${styles.heroSection} relative overflow-hidden`}>
    <HeroBg />
    {/* <HeroBgTwo /> */}
    <div className="absolute -bottom-80 left-1/2 opacity-90 -translate-x-1/2 w-[1920px] h-auto z-0 pointer-events-none">
      <Image
        src="/showcase-bg.svg"
        alt="Showcase Background"
        width={1920}
        height={600}
        className="w-full h-auto"
        priority
      />
    </div>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Precision Insights for<br /> Medical Results
        </h1>
        <h2 className={styles.heroSubheading}>
          It shouldn’t be confusing.
        </h2>
        <p className={styles.heroSubtitle}>
          Upload your medical results and get clear explanations<br />
          so you know what to do next
        </p>
        <div className={styles.heroButtons}>
           <button className={styles.btnBlack}>Get Started <ArrowRight size={16} className="ml-2" /></button>
          <button className={styles.btnOutline}>Learn More</button>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto -translate-y-6 relative px-8 z-10">
        <Image 
          src="/klaro-showcase.png" 
          alt="Klaro Showcase" 
          width={1920} 
          height={1200} 
          className="w-full h-auto"
          priority
          quality={100}
        />
      </div>
    </section>
  );
}
