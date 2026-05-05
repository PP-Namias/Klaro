import styles from "../../app/sample-landing/page.module.css";

export function Security() {
  return (
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
  );
}
