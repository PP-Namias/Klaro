import { Navbar } from "~/layouts/Landing/Navbar";
import { Hero } from "~/layouts/Landing/Hero";
import { Clarity } from "~/layouts/Landing/Clarity";
import { Features } from "~/layouts/Landing/Features";
import { MoreThanScanning } from "~/layouts/Landing/MoreThanScanning";
import { Security } from "~/layouts/Landing/Security";
import { Testimonials } from "~/layouts/Landing/Testimonials";
import { CTA } from "~/layouts/Landing/CTA";
import { Footer } from "~/layouts/Landing/Footer";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={`${styles.page} overflow-x-hidden`}>
      <Navbar />

      <Hero />
      <main className={styles.main}>
        <Clarity />
        <Features />
        <MoreThanScanning />
        <Security />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

