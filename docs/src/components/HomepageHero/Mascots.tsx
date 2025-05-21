import React, { useEffect, useRef } from "react";
import { translate } from "@docusaurus/Translate";
import styles from "./Mascots.module.css";

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
  // Create refs for the mascot elements to check their positions
  const squirrelRef = useRef<HTMLDivElement>(null);
  const duckRef = useRef<HTMLDivElement>(null);

  // Get translated messages as strings directly using translate() function
  const squirrelMessage = mascotsInteracting
    ? translate({
        id: "homepage.mascots.squirrel.interacting",
        message: "We make a great team! 🤝",
        description: "Squirrel mascot message when interacting",
      })
    : translate({
        id: "homepage.mascots.squirrel.default",
        message: "I love storing reactive state! 🌰",
        description: "Default squirrel mascot message",
      });

  const duckMessage = mascotsInteracting
    ? translate({
        id: "homepage.mascots.duck.interacting",
        message: "Dynamic duo! 💪",
        description: "Duck mascot message when interacting",
      })
    : translate({
        id: "homepage.mascots.duck.default",
        message: "Quack! JSON on demand! 📦",
        description: "Default duck mascot message",
      });

  const squirrelTitle = translate({
    id: "homepage.mascots.squirrel.title",
    message: "Click to make friends with the duck!",
    description: "Tooltip title for squirrel mascot",
  });

  const duckTitle = translate({
    id: "homepage.mascots.duck.title",
    message: "Click to make friends with the squirrel!",
    description: "Tooltip title for duck mascot",
  });

  // Effect to ensure mascots stay within visible bounds when interacting
  useEffect(() => {
    if (mascotsInteracting) {
      // Check if squirrel is too close to the left edge
      if (squirrelRef.current) {
        const rect = squirrelRef.current.getBoundingClientRect();
        // If squirrel is too close to left edge, adjust position
        if (rect.left < 100) {
          squirrelRef.current.style.left = "100px";
        }

        // Check speech bubble position as well
        const speechBubble = squirrelRef.current.querySelector(
          `.${styles.speechBubble}`
        );
        if (speechBubble) {
          const bubbleRect = (
            speechBubble as HTMLElement
          ).getBoundingClientRect();
          if (bubbleRect.left < 20) {
            // Adjust the speech bubble position if it's too close to the edge
            (speechBubble as HTMLElement).style.left = "0px";
          }
        }
      }
    } else {
      // Reset custom positioning when not interacting
      if (squirrelRef.current) {
        squirrelRef.current.style.left = "";
        const speechBubble = squirrelRef.current.querySelector(
          `.${styles.speechBubble}`
        );
        if (speechBubble) {
          (speechBubble as HTMLElement).style.left = "";
        }
      }
    }
  }, [mascotsInteracting, styles.speechBubble]);

  return (
    <div
      className={`${styles.heroMascots} ${
        mascotsInteracting ? styles.interacting : ""
      }`}
    >
      <div
        ref={squirrelRef}
        className={`${styles.heroMascot} ${styles.heroMascotSquirrel}`}
        onClick={() => setMascotsInteracting(!mascotsInteracting)}
        onMouseEnter={handleMascotHover}
        title={squirrelTitle}
      >
        🐿️
        <div className={styles.speechBubble} data-message={squirrelMessage} />
      </div>
      <div
        ref={duckRef}
        className={`${styles.heroMascot} ${styles.heroMascotDuck}`}
        onClick={() => setMascotsInteracting(!mascotsInteracting)}
        onMouseEnter={handleMascotHover}
        title={duckTitle}
      >
        🦆
        <div className={styles.speechBubble} data-message={duckMessage} />
      </div>

      {/* Add disco balls and sparkles when interacting */}
      {mascotsInteracting && (
        <>
          <div className={styles.heroMascotsSparkle} aria-hidden="true">
            ✨
          </div>
          <div
            className={`${styles.heroMascotsDisco} ${styles.discoBallLeft}`}
            aria-hidden="true"
          >
            🪩
          </div>
          <div
            className={`${styles.heroMascotsDisco} ${styles.discoBallRight}`}
            aria-hidden="true"
          >
            🪩
          </div>
        </>
      )}
    </div>
  );
}
