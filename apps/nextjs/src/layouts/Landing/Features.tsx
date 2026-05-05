import styles from "../../app/sample-landing/page.module.css";

export function Features() {
  return (
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
  );
}
