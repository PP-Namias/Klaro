import { Clarity } from "~/layouts/Landing/Clarity";
import { CTA as Cta } from "~/layouts/Landing/CTA";
import { Features } from "~/layouts/Landing/Features";
import { LandingDemoVideo } from "~/layouts/Landing/LandingDemoVideo";
import { Footer } from "~/layouts/Landing/Footer";
import { Hero } from "~/layouts/Landing/Hero";
import { MoreThanScanning } from "~/layouts/Landing/MoreThanScanning";
import { Navbar } from "~/layouts/Landing/Navbar";
import { Security } from "~/layouts/Landing/Security";
import { Testimonials } from "~/layouts/Landing/Testimonials";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={`${styles.page} overflow-x-hidden`}>
      <Navbar />

      <Hero />
      <LandingDemoVideo />
      <main className={styles.main}>
        <Clarity />
        <Features />
        <MoreThanScanning />
        <Security />
        <Testimonials />
        <Cta />
      </main>

      <Footer />
    </div>
  );
}
