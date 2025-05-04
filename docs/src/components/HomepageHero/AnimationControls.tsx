import React from "react";

interface AnimationControlsProps {
  isPaused: boolean;
  toggleAnimation: () => void;
}

export default function AnimationControls({
  isPaused,
  toggleAnimation,
}: AnimationControlsProps): React.ReactElement {
  return (
    <button
      onClick={toggleAnimation}
      className="animation-control-button"
      aria-label={isPaused ? "Play animations" : "Pause animations"}
      title={isPaused ? "Play animations" : "Pause animations"}
    >
      {isPaused ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Play
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
          Pause
        </>
      )}
    </button>
  );
}
