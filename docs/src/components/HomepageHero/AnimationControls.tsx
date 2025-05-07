import React from "react";
import { useAnimationState } from "../AnimationPauseControl";
import styles from "./AnimationControls.module.css";

export default function AnimationControls(): React.ReactElement {
  const { isPaused, toggleAnimation } = useAnimationState();

  return (
    <button
      onClick={toggleAnimation}
      className={styles.animationControlButton}
      aria-label={isPaused ? "Play animations" : "Pause animations"}
      title={isPaused ? "Play animations" : "Pause animations"}
    >
      {isPaused ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      )}
    </button>
  );
}
