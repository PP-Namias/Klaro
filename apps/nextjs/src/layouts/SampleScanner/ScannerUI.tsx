import Image from "next/image";
import { Scan, Paperclip, Sparkles, Lock } from "lucide-react";
import styles from "../../app/sample-scanner/page.module.css";

export function ScannerUI() {
  return (
    <div className={styles.scannerContainer}>
      <h1 className={styles.title}>Scan Your Results. Understand Them Instantly.</h1>
      <p className={styles.subtitle}>
        Upload your medical documents and get clear explanations<br/>then ask <strong className="text-black">Clara</strong> anything
      </p>

      <div className={styles.cardGrid}>
        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Lab Results</h3>
          <p className={styles.scanCardDesc}>Blood tests, CBC, cholesterol, and more</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/1.png" alt="Lab Results" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Prescriptions</h3>
          <p className={styles.scanCardDesc}>Understand medicines and instructions clearly</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/2.png" alt="Prescriptions" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Discharge<br/>Summaries</h3>
          <p className={styles.scanCardDesc}>Break down hospital notes and next steps</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/3.png" alt="Discharge Summaries" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Other<br/>Documents</h3>
          <p className={styles.scanCardDesc}>Upload any medical file and we'll analyze it</p>
          <div className={styles.scanCardImageContainer}>
            <Image src="/scan/4.png" alt="Other Documents" fill style={{ objectFit: "contain", objectPosition: "bottom" }} />
          </div>
        </div>
      </div>

      <div className={styles.workspaceWrapper}>
        <div className={styles.claraChatBubble}>
          <div className={styles.claraBubbleAvatar}>
            <Image src="/clara.png" alt="Clara" fill style={{ objectFit: "cover", borderRadius: "50%" }} />
            <div className={styles.chatClaraStatus}></div>
          </div>
          <span>Hi! <strong>Start Scanning</strong> or <strong>Upload a document</strong> and <strong>ask me a health question.</strong></span>
        </div>

        <div className={styles.scannerWorkspace}>
          <div className={styles.scannerBox}>
            <div className={`${styles.scannerBracket} ${styles.bracketTopLeft}`}></div>
            <div className={`${styles.scannerBracket} ${styles.bracketTopRight}`}></div>
            <div className={`${styles.scannerBracket} ${styles.bracketBottomLeft}`}></div>
            <div className={`${styles.scannerBracket} ${styles.bracketBottomRight}`}></div>
            
            <button className={styles.primaryBtn}>
              <Scan size={16} /> Take a photo & Scan here
            </button>
          </div>

          <div className={styles.uploadBox}>
            <button className={styles.secondaryBtn}>
              <Paperclip size={16} /> Drag or Upload a document
            </button>
          </div>

          <div className={styles.footerNotes}>
            <div className={styles.footerNoteItem}>
              <Sparkles size={14} /> Analysis & Chat
            </div>
            <div className={styles.footerNoteItem}>
              <Lock size={14} /> Your data is private and secure.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
