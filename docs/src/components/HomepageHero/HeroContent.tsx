import React from "react";
import Link from "@docusaurus/Link";
import styles from "./HeroContent.module.css";

export default function HeroContent(): React.ReactElement {
  return (
    <div className={styles.heroContent}>
      <h1 className={styles.heroTitle}>
        <span className={styles.jodsLogo}>
          <span className={styles.jodsLogoBraces}>{"{ "}</span> jods{" "}
          <span className={styles.jodsLogoBraces}>{" }"}</span>
        </span>
      </h1>

      <p className={styles.heroSubtitle}>
        <span className={styles.emoji}>✨</span>
        JSON Dynamics System
        <span className={styles.emoji}>🔄</span>
      </p>

      <p className={styles.heroDescription}>Brings JSON to life</p>

      <div className={styles.heroFeatures}>
        <span>🌱 Minimal</span>
        <span className={styles.separator}>•</span>
        <span>🔍 Typesafe</span>
        <span className={styles.separator}>•</span>
        <span>⚡ Fast</span>
      </div>

      <div className={styles.heroButtons}>
        <Link
          to="/examples"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Get Started
        </Link>

        <Link to="/remix" className={`${styles.button} ${styles.buttonRemix}`}>
          <span className={styles.remixButtonIcon}>💿</span> Remix
        </Link>
      </div>
    </div>
  );
}
