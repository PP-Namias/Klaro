"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Map,
  Calendar,
  Home,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";

import styles from "../../app/scan/page.module.css";
import CalModal from "../../components/CalModal";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCalOpen, setIsCalOpen] = useState(false);

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}
    >
      <div className={styles.sidebarHeader}>
        {!isCollapsed && (
          <button className={styles.sidebarActionBtn}>
            <Sparkles size={20} color="#999" />
          </button>
        )}
        <button
          className={styles.sidebarActionBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={
            isCollapsed
              ? { border: "none", background: "transparent", padding: "0.5rem" }
              : {}
          }
        >
          <PanelLeftClose
            size={20}
            color="#999"
            style={isCollapsed ? { transform: "scaleX(-1)" } : {}}
          />
        </button>
      </div>

      <div className={styles.chatClaraContainer}>
        <div className={styles.chatClaraAvatar}>
          <Image
            src="/clara.png"
            alt="Clara"
            fill
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
          <div className={styles.chatClaraStatus}></div>
        </div>
        {!isCollapsed && (
          <button className={styles.chatClaraBtn}>Chat with Clara!</button>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        <Link href="/" className={styles.navItem}>
          <Home size={20} color="#999" /> {!isCollapsed && <span>Home</span>}
        </Link>
        <Link href="/maps" className={styles.navItem}>
          <Map size={20} color="#999" />{" "}
          {!isCollapsed && <span>Maps</span>}
        </Link>
        <hr className={styles.sidebarDivider} />
      </nav>

      <div className={styles.sidebarFooter}>
        <button
          className={styles.bookDoctorBtn}
          onClick={() => setIsCalOpen(true)}
        >
          <Calendar size={20} color="#999" />{" "}
          {!isCollapsed && <span>Book a Doctor</span>}
        </button>
        <CalModal open={isCalOpen} onClose={() => setIsCalOpen(false)} />
      </div>
    </aside>
  );
}
