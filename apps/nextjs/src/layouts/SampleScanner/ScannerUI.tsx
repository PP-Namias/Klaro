import Image from "next/image";
import { Bot, Lock, Paperclip, Scan, Sparkles } from "lucide-react";

import styles from "../../app/sample-scanner/page.module.css";

export function ScannerUI() {
  return (
    <div className={styles.scannerContainer}>
      <h1 className={styles.title}>
        Scan Your Results. Understand Them Instantly.
      </h1>
      <p className={styles.subtitle}>
        Upload your medical documents and get clear explanations
        <br />
        then ask <span className={styles.claraText}>Clara</span> anything
      </p>

      <div className={styles.cardGrid}>
        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Lab Results</h3>
          <p className={styles.scanCardDesc}>
            Blood tests, CBC, cholesterol, and more
          </p>
          <div className={styles.scanCardImageContainer}>
            <Image
              src="/scan/1.png"
              alt="Lab Results"
              fill
              style={{ objectFit: "contain", objectPosition: "bottom" }}
            />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>Prescriptions</h3>
          <p className={styles.scanCardDesc}>
            Understand medicines and instructions clearly
          </p>
          <div className={styles.scanCardImageContainer}>
            <Image
              src="/scan/2.png"
              alt="Prescriptions"
              fill
              style={{ objectFit: "contain", objectPosition: "bottom" }}
            />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>
            Discharge
            <br />
            Summaries
          </h3>
          <p className={styles.scanCardDesc}>
            Break down hospital notes and next steps
          </p>
          <div className={styles.scanCardImageContainer}>
            <Image
              src="/scan/3.png"
              alt="Discharge Summaries"
              fill
              style={{ objectFit: "contain", objectPosition: "bottom" }}
            />
          </div>
        </div>

        <div className={styles.scanCard}>
          <h3 className={styles.scanCardTitle}>
            Other
            <br />
            Documents
          </h3>
          <p className={styles.scanCardDesc}>
            Upload any medical file and we'll analyze it
          </p>
          <div className={styles.scanCardImageContainer}>
            <Image
              src="/scan/4.png"
              alt="Other Documents"
              fill
              style={{ objectFit: "contain", objectPosition: "bottom" }}
            />
          </div>
        </div>
      </div>

      <div className={styles.workspaceWrapper}>
        <div className={styles.claraChatWrapper}>
          <div className={styles.claraChatAvatar}>
            <Image
              src="/clara.png"
              alt="Clara"
              fill
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
            <div className={styles.chatClaraStatus}></div>
          </div>
          <div className={styles.claraChatBubble}>
            Hi! Start Scanning or Upload a document and ask me a health question.
          </div>
        </div>

        <div className={styles.scannerWorkspace}>
          <div className={styles.scannerBox}>
            <svg
              className={`${styles.scannerBracket} ${styles.bracketTopLeft}`}
              viewBox="0 0 40 40"
            >
              <path
                d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              className={`${styles.scannerBracket} ${styles.bracketTopRight}`}
              viewBox="0 0 40 40"
            >
              <path
                d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              className={`${styles.scannerBracket} ${styles.bracketBottomLeft}`}
              viewBox="0 0 40 40"
            >
              <path
                d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              className={`${styles.scannerBracket} ${styles.bracketBottomRight}`}
              viewBox="0 0 40 40"
            >
              <path
                d="M 4 32 V 10 C 4 6.7 6.7 4 10 4 H 32"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <button className={styles.primaryBtn}>
              <Scan size={18} /> Take a photo & Scan here
            </button>
          </div>

          <div className={styles.uploadWrapper}>
            <div className={styles.uploadBox}>
              <button className={styles.secondaryBtn}>
                <Paperclip size={18} /> Drag or Upload a document
              </button>
            </div>
          </div>

          <div className={styles.footerNotes}>
            <div className={styles.footerNoteItem}>
              <Bot size={16} /> Analysis & Chat
            </div>
            <div className={styles.footerNoteItem}>
              <Lock size={16} /> Your data is private and secure.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
