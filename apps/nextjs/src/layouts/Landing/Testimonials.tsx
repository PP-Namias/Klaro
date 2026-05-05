import styles from "../../app/sample-landing/page.module.css";

export function Testimonials() {
  return (
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
  );
}
