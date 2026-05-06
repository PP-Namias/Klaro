"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BarChart2,
  Calendar,
  CircleUser,
  Home,
  PanelLeftClose,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import styles from "../../app/sample-scanner/page.module.css";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        <a href="#" className={styles.navItem}>
          <Home size={20} color="#999" /> {!isCollapsed && <span>Home</span>}
        </a>
        <a href="#" className={styles.navItem}>
          <BarChart2 size={20} color="#999" />{" "}
          {!isCollapsed && <span>Results</span>}
        </a>
        <hr className={styles.sidebarDivider} />
        <a href="#" className={styles.navItem}>
          <SlidersHorizontal size={20} color="#999" />{" "}
          {!isCollapsed && <span>Settings</span>}
        </a>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.bookDoctorBtn}>
          <Calendar size={20} color="#999" />{" "}
          {!isCollapsed && <span>Book a Doctor</span>}
        </button>
        <a href="#" className={styles.navItem}>
          <CircleUser size={20} color="#555" />{" "}
          {!isCollapsed && <span>Profile</span>}
        </a>
      </div>
    </aside>
  );
}
