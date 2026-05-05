import styles from "../../app/sample-landing/page.module.css";

export function MoreThanScanning() {
  return (
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
  );
}
