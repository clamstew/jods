import React, { useEffect, useRef, useState } from "react";
import { useAnimationState } from "../AnimationPauseControl";
import styles from "./FooterBackground.module.css";

interface Firefly {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export function FooterBackground(): React.ReactElement {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const { isPaused, toggleAnimation } = useAnimationState();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Generate random fireflies
  useEffect(() => {
    if (!containerRef.current) return;

    // Create initial fireflies
    const count = Math.floor(Math.random() * 15) + 25; // 25-40 fireflies (increased)
    const newFireflies: Firefly[] = [];

    for (let i = 0; i < count; i++) {
      newFireflies.push(createFirefly(i));
    }

    setFireflies(newFireflies);

    // Start animation cycle
    const animateFireflies = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(animateFireflies);
        return;
      }

      setFireflies((prev) => {
        return prev.map((fly) => {
          // If it's time to regenerate this firefly
          if (Date.now() > fly.delay + fly.duration) {
            return createFirefly(fly.id);
          }
          return fly;
        });
      });

      animationFrameRef.current = requestAnimationFrame(animateFireflies);
    };

    animationFrameRef.current = requestAnimationFrame(animateFireflies);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused]);

  // Function to create a new firefly with random properties
  const createFirefly = (id: number): Firefly => {
    return {
      id,
      x: Math.random() * 100, // % of container width
      y: Math.random() * 100, // % of container height
      size: Math.random() * 4 + 1.5, // 1.5-5.5px (increased)
      opacity: Math.random() * 0.6 + 0.3, // 0.3-0.9 (increased)
      duration: Math.random() * 8000 + 4000, // 4-12 seconds
      delay: Date.now() + Math.random() * 5000, // random start delay (reduced)
    };
  };

  return (
    <div className={styles.background} ref={containerRef} style={{ zIndex: 2 }}>
      {/* Actual fireflies */}
      {fireflies.map((fly) => (
        <div
          key={fly.id}
          className={styles.firefly}
          style={{
            left: `${fly.x}%`,
            top: `${fly.y}%`,
            width: `${fly.size}px`,
            height: `${fly.size}px`,
            opacity: fly.opacity,
            animationPlayState: isPaused ? "paused" : "running",
            boxShadow: `0 0 ${fly.size * 2}px rgba(255, 255, 255, 0.8), 0 0 ${
              fly.size * 3
            }px rgba(255, 154, 92, 0.6)`,
          }}
        />
      ))}

      {/* Accessibility: Animation control */}
      <button
        onClick={toggleAnimation}
        className={styles.animationControl}
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
    </div>
  );
}
