import React, { useState } from "react";
import { translate } from "@docusaurus/Translate";
import styles from "./FooterMascots.module.css";

export function FooterMascots(): React.ReactElement {
  const [interacting, setInteracting] = useState(false);

  const handleInteraction = () => {
    setInteracting((prev) => !prev);
  };

  // Translations from homepage-components/footer.json
  const duckTitle = translate({
    id: "footer.mascots.duck.title",
    message: "Click to make friends with the duck!",
    description: "Title for duck mascot",
  });

  const squirrelTitle = translate({
    id: "footer.mascots.squirrel.title",
    message: "Click to make friends with the squirrel!",
    description: "Title for squirrel mascot",
  });

  return (
    <div
      className={`${styles.mascots} ${interacting ? styles.interacting : ""}`}
    >
      <span
        className={styles.mascot}
        onClick={handleInteraction}
        title={squirrelTitle}
      >
        🐿️
      </span>
      <span
        className={styles.mascot}
        onClick={handleInteraction}
        title={duckTitle}
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
