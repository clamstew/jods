import React, { useState } from "react";
import styles from "./FooterMascots.module.css";

export function FooterMascots(): React.ReactElement {
  const [interacting, setInteracting] = useState(false);

  const handleInteraction = () => {
    setInteracting((prev) => !prev);
  };

  return (
    <div
      className={`${styles.mascots} ${interacting ? styles.interacting : ""}`}
    >
      <span
        className={styles.mascot}
        onClick={handleInteraction}
        title="Click to make friends with the duck!"
      >
        🐿️
      </span>
      <span
        className={styles.mascot}
        onClick={handleInteraction}
        title="Click to make friends with the squirrel!"
      >
        🦆
      </span>

      {/* Show sparkle emoji when interacting */}
      {interacting && (
        <span className={styles.sparkle} aria-hidden="true">
          ✨
        </span>
      )}
    </div>
  );
}
