import styles from "../../app/scan/page.module.css";

const previewRows = [
  {
    label: "Glucose",
    value: "118 mg/dL",
    status: "Moderate",
  },
  {
    label: "Hemoglobin",
    value: "13.2 g/dL",
    status: "Normal",
  },
  {
    label: "Creatinine",
    value: "1.1 mg/dL",
    status: "Normal",
  },
] as const;

const analysisTags = [
  "Plain language",
  "Tagalog ready",
  "Guest safe",
  "Private link",
] as const;

interface ScanPreviewProps {
  session: any;
}

export function ScanPreview({ session }: ScanPreviewProps) {
  return (
    <aside className={styles.scan__preview}>
      <div className={styles.scan__previewHeader}>
        <span className={styles.scan__previewTitle}>Analysis preview</span>
        <span className={styles.scan__previewPill}>
          {session ? "active" : "guest"}
        </span>
      </div>

      <article className={styles.scan__summaryCard}>
        <span className={styles.scan__summaryLabel}>Plain-language read</span>
        <h2 className={styles.scan__summaryTitle}>
          One value is above target, but the rest stay in range.
        </h2>
        <p className={styles.scan__summaryCopy}>
          Klaro explains the flagged result in simple language and keeps the
          advice short enough to act on without losing context.
        </p>

        <div className={styles.scan__summaryTags}>
          {analysisTags.map((tag) => (
            <span key={tag} className={styles.scan__summaryTag}>
              {tag}
            </span>
          ))}
        </div>
      </article>

      <div className={styles.scan__results}>
        {previewRows.map((row) => (
          <div key={row.label} className={styles.scan__resultRow}>
            <div>
              <div className={styles.scan__resultLabel}>{row.label}</div>
              <div className={styles.scan__resultValue}>{row.value}</div>
            </div>
            <span className={styles.scan__resultStatus}>{row.status}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
