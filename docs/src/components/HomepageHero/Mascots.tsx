import React from "react";
import styles from "./HomepageHero.module.css";

interface MascotsProps {
  mascotsInteracting: boolean;
  setMascotsInteracting: (value: boolean) => void;
  handleMascotHover: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Mascots({
  mascotsInteracting,
  setMascotsInteracting,
  handleMascotHover,
}: MascotsProps): React.ReactElement {
  return (
    <div
      className={`${styles.heroMascots} ${
        mascotsInteracting ? styles.interacting : ""
      }`}
    >
      <div
        className={`${styles.heroMascot} ${styles.heroMascotSquirrel}`}
        onClick={() => setMascotsInteracting(!mascotsInteracting)}
        onMouseEnter={handleMascotHover}
        title="Click to make friends with the duck!"
      >
        🐿️
        <div
          className={styles.speechBubble}
          data-message={
            mascotsInteracting
              ? "We make a great team! 🤝"
              : "I love storing reactive state! 🌰"
          }
        />
      </div>
      <div
        className={`${styles.heroMascot} ${styles.heroMascotDuck}`}
        onClick={() => setMascotsInteracting(!mascotsInteracting)}
        onMouseEnter={handleMascotHover}
        title="Click to make friends with the squirrel!"
      >
        🦆
        <div
          className={styles.speechBubble}
          data-message={
            mascotsInteracting ? "Dynamic duo! 💪" : "Quack! JSON on demand! 📦"
          }
        />
      </div>

      {/* Add sparkle when interacting */}
      {mascotsInteracting && (
        <div className={styles.heroMascotsSparkle} aria-hidden="true">
          ✨
        </div>
      )}
    </div>
  );
}
