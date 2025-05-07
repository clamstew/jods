import React from "react";
import styles from "./FooterCopyright.module.css";

export function FooterCopyright(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.copyright}>
      <div>
        Built with <span className={styles.heart}>💚</span> by{" "}
        <a
          href="https://github.com/clamstew"
          target="_blank"
          rel="noopener noreferrer"
        >
          clamstew
        </a>
      </div>
      <div>Copyright © {currentYear} jods contributors</div>
    </div>
  );
}
