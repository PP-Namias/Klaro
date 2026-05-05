import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Header Navbar */}
      <header className={styles.headerNav}>
        <div className={styles.headerLogo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px', verticalAlign: 'middle'}}><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor"/></svg>
          Klaro
        </div>
        <div className={styles.headerLinks}>
          <a href="#" className={styles.headerLink}>Home</a>
          <a href="#" className={styles.headerLink}>Features ⌄</a>
          <a href="#" className={styles.headerLink}>Security</a>
          <a href="#" className={styles.headerLink}>Blog ⌄</a>
          <button className={styles.headerBtn}>Sign in &rarr;</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Section 1: Hero */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Precision Insights for Your<br />
              <span className={styles.heroTitleItalic}>Medical Results</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Upload your medical results and get clear<br />
              explanations so you know what to do next
            </p>
            <div className={styles.heroButtons}>
              <button className={styles.btnBlack}>Get Started &rarr;</button>
              <button className={styles.btnOutline}>Learn More</button>
            </div>
          </div>

          {/* Floating UI Scanner Block */}
          <div className={styles.scannerWrapper}>
            <div className={styles.scannerImagePlaceholder}></div>
          </div>
        </section>

        {/* Section 1: Clarity From Results to Care */}
        <section className={styles.section}>
          <h2 className={styles.title}>Clarity From Results to Care</h2>
          <div className={styles.grid3}>
            <div className={styles.cardMedium}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Connect to Real Doctors</h3>
                <p className={styles.cardBody}>Consult licensed Filipino doctors via chat or video and get guidance based on your results</p>
              </div>
              <div className={styles.cardImagePlaceholder}>
                 {/* Image will go here */}
                 <span></span>
              </div>
            </div>
            <div className={styles.cardMedium}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Understand Your Results</h3>
                <p className={styles.cardBody}>Upload your medical documents and get clear explanations with key insights</p>
              </div>
              <div className={styles.cardImagePlaceholder}>
                 {/* Image will go here */}
                 <span></span>
              </div>
            </div>
            <div className={styles.cardMedium}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Find the Right Care Near You</h3>
                <p className={styles.cardBody}>Find nearby clinics and hospitals based on your needs, availability, and specialty</p>
              </div>
              <div className={styles.cardImagePlaceholder}>
                 {/* Image will go here */}
                 <span></span>
              </div>
            </div>
          </div>
        </section>
        {/* Section 2: How Klaro Helps */}
        <section className={styles.section}>
          <h2 className={styles.titleSection2}>How Klaro helps Clarify your Health</h2>
          <div className={styles.grid2}>
            <div className={styles.cardWide}>
               <div className={styles.cardContent}>
                 <div>
                   <h3 className={styles.cardTitleDark}>Learn</h3>
                   <p className={styles.cardBody}>AI explains what "High Creatinine" actually means for you.</p>
                 </div>
                 <a href="#" className={styles.cardLink}>Try it out &rarr;</a>
               </div>
               <div className={styles.cardImageWide}></div>
            </div>
            
            <div className={styles.cardMediumSquare}>
               <div className={styles.cardHeader}>
                 <h3 className={styles.cardTitleDark}>Learn</h3>
                 <p className={styles.cardBody}>AI explains what "High Creatinine" actually means for you.</p>
               </div>
               <div className={styles.cardImagePlaceholderLight}></div>
            </div>
            
            <div className={styles.cardMediumSquare}>
               <div className={styles.cardHeader}>
                 <h3 className={styles.cardTitleDark}>Learn</h3>
                 <p className={styles.cardBody}>AI explains what "High Creatinine" actually means for you.</p>
               </div>
               <div className={styles.cardImagePlaceholderLight}></div>
            </div>
          </div>
        </section>

        {/* Section 3: More than just Scanning */}
        <section className={styles.section}>
          <h2 className={styles.titleCenter}>More than just Scanning</h2>
          <div className={styles.gridScanning}>
             <div className={styles.cardTall}>
               <div className={styles.cardHeader}>
                 <h3 className={styles.cardTitleDark}>PhilHealth Integration</h3>
                 <p className={styles.cardBody}>Easily filter for PhilHealth-accredited clinics and hospitals. Get benefits and save on medical costs.</p>
               </div>
               <div className={styles.cardImageTall}></div>
             </div>
             
             <div className={styles.stackedCards}>
               <div className={styles.cardHorizontal}>
                 <div className={styles.cardContentHorizontal}>
                   <h3 className={styles.cardTitleDark}>Local Payments</h3>
                   <p className={styles.cardBody}>Pay for consultations and tests directly using GCash or Maya.</p>
                 </div>
                 <div className={styles.cardImageSquare}></div>
               </div>
               <div className={styles.cardHorizontal}>
                 <div className={styles.cardContentHorizontal}>
                   <h3 className={styles.cardTitleDark}>Secure Medical History</h3>
                   <p className={styles.cardBody}>One encrypted vault for all your labs, prescriptions, and discharge summaries.</p>
                 </div>
                 <div className={styles.cardImageSquare}></div>
               </div>
             </div>
          </div>
          
          <div className={styles.quoteSection}>
             <h3 className={styles.quoteText}>“Health is complex. Understanding it shouldn't be.”</h3>
             <div className={styles.avatarBlock}>
                <div className={styles.avatarCircle}></div>
                <div className={styles.avatarText}>
                   <p className={styles.avatarName}>Clara</p>
                   <p className={styles.avatarRole}>Klaro's AI doctor</p>
                </div>
             </div>
          </div>
        </section>

        {/* Section 4: Secure by Design */}
        <section className={styles.section}>
          <h2 className={styles.titleLeft}>Secure by Design</h2>
          <div className={styles.grid2}>
            <div className={styles.secureImageBlock}>
               {/* Safe Image Placeholder */}
            </div>
            <div className={styles.secureTextBlock}>
               <h3 className={styles.secureTitle}>Medical-grade privacy</h3>
               <p className={styles.secureBody}>Your health data belongs to you. Every document is encrypted with AES-256 standards, the same used by banks. We comply with the Data Privacy Act to ensure your medical history stays in your hands only.</p>
               <a href="#" className={styles.secureLink}>How we protect you &rarr;</a>
            </div>
          </div>
        </section>

        {/* Section 5: People helped by Klaro */}
        <section className={styles.section}>
          <h2 className={styles.titleLeft}>People helped by Klaro</h2>
          <div className={styles.testimonialContainer}>
            {/* Top Wide Card */}
            <div className={styles.cardWideTestimonial}>
               <div className={styles.testimonialContent}>
                 <div>
                   <h3 className={styles.testimonialName}>Maria Santos</h3>
                   <p className={styles.testimonialRole}>Mother of two, Patient</p>
                 </div>
                 <p className={styles.testimonialQuote}>“I used to spend hours Googling my lab results and just getting more worried. With Klaro, I got a clear explanation in Tagalog in seconds. It’s like having a doctor in my pocket..”</p>
                 <a href="#" className={styles.cardLink}>Read Full Story &rarr;</a>
               </div>
               <div className={styles.testimonialImageWide}></div>
            </div>

            {/* Bottom 3 Cards */}
            <div className={styles.grid3}>
              <div className={styles.cardTestimonialTall}>
                <div className={styles.testimonialHeader}>
                   <h3 className={styles.testimonialName}>Juan Dela Cruz</h3>
                   <p className={styles.testimonialRole}>Family Caregiver</p>
                </div>
                <p className={styles.testimonialQuoteSmall}>Now everything is in one secure place and actually makes sense.</p>
                <div className={styles.testimonialImageSmall}></div>
              </div>
              <div className={styles.cardTestimonialTall}>
                <div className={styles.testimonialHeader}>
                   <h3 className={styles.testimonialName}>Dr. Elena Reyes, MD</h3>
                   <p className={styles.testimonialRole}>General Physician</p>
                </div>
                <p className={styles.testimonialQuoteSmall}>We spend less time explaining jargon and more time on the treatment plan.</p>
                <div className={styles.testimonialImageSmall}></div>
              </div>
              <div className={styles.cardTestimonialTall}>
                <div className={styles.testimonialHeader}>
                   <h3 className={styles.testimonialName}>Paolo Gomez</h3>
                   <p className={styles.testimonialRole}>WFH Professional</p>
                </div>
                <p className={styles.testimonialQuoteSmall}>I scan my results as soon as I get them. No waiting for the next day to know if I'm okay. Instant peace of mind.</p>
                <div className={styles.testimonialImageSmall}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: CTA */}
        <section className={styles.sectionCtaFinal}>
          <h2 className={styles.titleCenterCta}>Clear results are just a scan away</h2>
          <div className={styles.ctaImageLarge}></div>
          <p className={styles.ctaSubtitle}>
            Join thousands of Filipinos decoding their health jargon.<br />
            Take control of your medical journey today.
          </p>
          <div className={styles.ctaButtonContainer}>
            <button className={styles.btnBlack}>Open on Web &rarr;</button>
            <button className={styles.btnOutline}>Download Mobile</button>
          </div>
          <p className={styles.ctaSmallText}>Also available on App Store & Google Play. 100% Private</p>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footerFinal}>
        <div className={styles.footerContentFinal}>
          <div className={styles.footerLeft}>
             <div className={styles.footerLogoPlaceholder}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px', verticalAlign: 'middle'}}><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor"/></svg>
                Klaro
             </div>
             <p className={styles.footerCopyright}>&copy; 2026 Klaro. Built for the Philippines.</p>
          </div>
          
          <div className={styles.footerRight}>
             <div className={styles.footerLinkGroup}>
               <h4>Features</h4>
               <a href="#">Scan & Analyze</a>
               <a href="#">AI Medical Chat</a>
               <a href="#">Clinic Finder</a>
               <a href="#">Doctor Booking</a>
             </div>
             <div className={styles.footerLinkGroup}>
               <h4>Resources</h4>
               <a href="#">How it Works</a>
               <a href="#">Patient Stories</a>
               <a href="#">Security & Privacy</a>
               <a href="#">Contact Support</a>
             </div>
             <div className={styles.footerLinkGroup}>
               <h4>Legal</h4>
               <a href="#">Privacy Policy</a>
               <a href="#">Terms of Service</a>
               <a href="#">DPA Compliance</a>
               <a href="#">Cookie Settings</a>
             </div>
             <div className={styles.footerSocials}>
               <div className={styles.socialIcon}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
               </div>
               <div className={styles.socialIcon}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.05.05 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
               </div>
               <div className={styles.socialIcon}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
               </div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
