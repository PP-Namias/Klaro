import Image from "next/image";

import { ScannerNavbar } from "~/layouts/SampleScanner/ScannerNavbar";
import { ScannerUI } from "~/layouts/SampleScanner/ScannerUI";
import { Sidebar } from "~/layouts/SampleScanner/Sidebar";
import { ScanResults } from "~/components/scan-results";
import styles from "./page.tsx.module.css";

export default function ScanPage() {
	return (
		<div className={styles.layout}>
			<Sidebar />
			<div className={styles.mainWrapper}>
				<ScannerNavbar />
				<main className={styles.mainContent}>
					<ScanResults />
				</main>
			</div>
			<div className={styles.backgroundGlow}>
				<Image
					src="/scan-bg.svg"
					alt="Glow Background"
					fill
					style={{ objectFit: "cover", objectPosition: "bottom" }}
					priority
				/>
			</div>
		</div>
	);
}

