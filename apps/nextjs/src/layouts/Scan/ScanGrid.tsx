import styles from "../../app/scan/page.module.css";

const scanCards = [
  {
    title: "Upload a file",
    body: "Drop a photo, scan, or PDF to begin extraction.",
  },
  {
    title: "Review the result",
    body: "Read the plain-language summary and flagged values before you act.",
  },
  {
    title: "Continue with care",
    body: "Move into chat, clinic search, or booking without losing context.",
  },
] as const;

export function ScanGrid() {
  return (
    <section className={styles.scan__grid}>
      {scanCards.map((card, index) => (
        <article key={card.title} className={styles.scan__card}>
          <span className={styles.scan__cardIndex}>0{index + 1}</span>
          <h2 className={styles.scan__cardTitle}>{card.title}</h2>
          <p className={styles.scan__cardCopy}>{card.body}</p>
        </article>
      ))}
    </section>
  );
}
