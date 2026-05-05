import styles from "./page.module.css";

export default function SampleScanPage() {
  return (
    <main className={styles.canvas}>
      <div className={styles.canvasInner}>
        <p className={styles.canvasLabel}>Sample Scan Canvas</p>
      </div>
    </main>
  );
}
