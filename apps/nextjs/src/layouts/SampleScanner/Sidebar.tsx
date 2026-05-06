"use client";

import { useState } from "react";
import Image from "next/image";
import { PanelLeftClose, Sparkles, Home, BarChart2, SlidersHorizontal, Calendar, CircleUser } from "lucide-react";
import styles from "../../app/sample-scanner/page.module.css";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        {!isCollapsed && (
          <button className={styles.sidebarActionBtn}>
            <Sparkles size={18} color="#999" />
          </button>
        )}
        <button 
          className={styles.sidebarActionBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={isCollapsed ? { border: 'none', background: 'transparent', padding: '0.5rem' } : {}}
        >
          <PanelLeftClose size={18} color="#999" style={isCollapsed ? { transform: 'scaleX(-1)', transition: 'transform 0.3s ease' } : { transition: 'transform 0.3s ease' }} />
        </button>
      </div>

      <div className={styles.chatClaraContainer}>
        <div className={styles.chatClaraAvatar}>
          <Image src="/clara.png" alt="Clara" fill style={{ objectFit: "cover", borderRadius: "50%" }} />
          <div className={styles.chatClaraStatus}></div>
        </div>
        {!isCollapsed && (
          <button className={styles.chatClaraBtn}>
            Chat with Clara!
          </button>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        <a href="#" className={styles.navItem}>
          <Home size={18} color="#999" /> {!isCollapsed && <span>Home</span>}
        </a>
        <a href="#" className={styles.navItem}>
          <BarChart2 size={18} color="#999" /> {!isCollapsed && <span>Results</span>}
        </a>
        <hr className={styles.sidebarDivider} />
        <a href="#" className={styles.navItem}>
          <SlidersHorizontal size={18} color="#999" /> {!isCollapsed && <span>Settings</span>}
        </a>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.bookDoctorBtn}>
          <Calendar size={18} color="#999" /> {!isCollapsed && <span>Book a Doctor</span>}
        </button>
        <a href="#" className={styles.navItem}>
          <CircleUser size={18} color="#555" /> {!isCollapsed && <span>Profile</span>}
        </a>
      </div>
    </aside>
  );
}
