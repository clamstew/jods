import React, { useEffect, useRef, useState } from "react";
import { useAnimationState } from "../AnimationPauseControl";
import { translate } from "@docusaurus/Translate";
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

interface Comet {
  x: number;
  y: number;
  size: number;
  angle: number;
  speed: number;
  opacity: number;
  active: boolean;
}

interface NeonGlow {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  delay: number;
}

interface CodeLine {
  id: number;
  y: number;
  width: number;
  isFromLeft: boolean;
  speed: number;
  delay: number;
}

interface DataRain {
  id: number;
  x: number;
  y: number;
  length: number;
  speed: number;
  delay: number;
  opacity: number;
}

export function FooterBackground(): React.ReactElement {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [neonGlows, setNeonGlows] = useState<NeonGlow[]>([]);
  const [codeLines, setCodeLines] = useState<CodeLine[]>([]);
  const [dataRain, setDataRain] = useState<DataRain[]>([]);
  const [comet, setComet] = useState<Comet>({
    x: -100,
    y: -100,
    size: 3,
    angle: 315,
    speed: 0.5,
    opacity: 0,
    active: false,
  });
  const { isPaused, toggleAnimation } = useAnimationState();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cometTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cometCooldownRef = useRef<boolean>(false);
  const dataRainRef = useRef<NodeJS.Timeout | null>(null);

  // Translate animation controls
  const playLabel = translate({
    id: "footer.animation.pause",
    message: "Play animations",
    description: "Accessible label for the play button",
  });

  const pauseLabel = translate({
    id: "footer.animation.pause",
    message: "Pause animations",
    description: "Accessible label for the pause button",
  });

  // Handle mouse enter or click for comet animation
  const triggerCometEvent = () => {
    if (!isPaused && !cometCooldownRef.current) {
      triggerComet();
    }
  };

  // Function to trigger a comet animation
  const triggerComet = () => {
    // Set cooldown to prevent rapid triggering
    cometCooldownRef.current = true;

    // Generate random starting position and angle
    const startX = Math.random() * 15 + 65;
    const startY = Math.random() * 15 + 60;
    const angle = Math.random() * 20 + 115;
    const size = Math.random() * 2 + 3;
    const speed = Math.random() * 0.2 + 0.3;

    setComet({
      x: startX,
      y: startY,
      size,
      angle,
      speed,
      opacity: 1.0,
      active: true,
    });

    // Clear any existing timer
    if (cometTimerRef.current) {
      clearTimeout(cometTimerRef.current);
    }

    // Set a timer to hide the comet after it finishes its journey
    cometTimerRef.current = setTimeout(() => {
      setComet((prev) => ({ ...prev, active: false }));

      // Add shorter cooldown period before allowing another comet
      setTimeout(() => {
        cometCooldownRef.current = false;
      }, 3000);
    }, 4000);
  };

  // Create a neon glow
  const createNeonGlow = (id: number): NeonGlow => {
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 200 + 100, // 100-300px
      hue: Math.floor(Math.random() * 60) + 180, // cyan-blue range
      delay: Math.random() * 5000,
    };
  };

  // Create a code line
  const createCodeLine = (id: number): CodeLine => {
    // Position lines primarily in the lower part of the footer
    const yPosition = Math.random() * 30 + 65; // 65-95% from top (bottom third of footer)

    // Make lines shorter (around 40% of viewport)
    const width = Math.random() * 15 + 25; // 25-40% width

    // Randomize whether line starts from left or right side
    const isFromLeft = Math.random() > 0.5;

    return {
      id,
      y: yPosition,
      width: width,
      isFromLeft: isFromLeft, // New property to determine starting position
      speed: Math.random() * 6 + 4, // 4-10s
      delay: Math.random() * 8000,
    };
  };

  // Create digital rain drop
  const createDataRain = (id: number, forceX?: number): DataRain => {
    const x = forceX !== undefined ? forceX : Math.random() * 100;
    return {
      id,
      x,
      y: -10 - Math.random() * 20, // Start above the viewport
      length: Math.random() * 12 + 5, // 5-17% height (reduced from 5-20%)
      speed: Math.random() * 0.7 + 0.3, // 0.3-1.0% per frame (reduced from 0.5-1.5%)
      delay: Math.random() * 2000,
      opacity: Math.random() * 0.25 + 0.1, // 0.1-0.35 opacity (reduced from 0.1-0.4)
    };
  };

  // Generate a new data rain drop at regular intervals
  const scheduleNewDataRain = () => {
    if (dataRainRef.current) {
      clearTimeout(dataRainRef.current);
    }

    if (!isPaused) {
      dataRainRef.current = setTimeout(() => {
        setDataRain((prev) => {
          // Keep array at reasonable size and limit max drops
          const filtered = prev.filter((drop) => drop.y < 110);
          if (filtered.length < 15) {
            // Reduced max from 20 to 15
            // Add a new drop at random X position
            const newId =
              prev.length > 0 ? Math.max(...prev.map((d) => d.id)) + 1 : 0;
            return [...filtered, createDataRain(newId)];
          }
          return filtered;
        });
        scheduleNewDataRain();
      }, Math.random() * 1200 + 600); // Every 600-1800ms (increased from 200-1000ms)
    } else {
      dataRainRef.current = setTimeout(() => scheduleNewDataRain(), 1000);
    }
  };

  // Generate random fireflies
  useEffect(() => {
    if (!containerRef.current) return;

    // Create initial fireflies - REDUCE COUNT BY ~15%
    const fireflyCount = Math.floor(Math.random() * 12) + 20; // 20-32 fireflies (reduced from 25-40)
    const newFireflies: Firefly[] = [];

    for (let i = 0; i < fireflyCount; i++) {
      newFireflies.push(createFirefly(i));
    }

    setFireflies(newFireflies);

    // Create neon glow spots - REDUCE COUNT
    const glowCount = Math.floor(Math.random() * 3) + 3; // 3-5 glow spots (reduced from 4-7)
    const newGlows: NeonGlow[] = [];

    for (let i = 0; i < glowCount; i++) {
      newGlows.push(createNeonGlow(i));
    }

    setNeonGlows(newGlows);

    // Create code lines - DRASTICALLY REDUCE COUNT (60% less)
    const lineCount = Math.floor(Math.random() * 3) + 4; // 4-6 code lines (reduced from 10-15)
    const newCodeLines: CodeLine[] = [];

    for (let i = 0; i < lineCount; i++) {
      newCodeLines.push(createCodeLine(i));
    }

    setCodeLines(newCodeLines);

    // Create initial data rain - CONCENTRATE IN LOWER HALF
    const rainCount = 8; // Reduced from 10
    const initialRain: DataRain[] = [];

    for (let i = 0; i < rainCount; i++) {
      // Distribute them evenly across the screen with random progress
      const x = (i / rainCount) * 100;
      const drop = createDataRain(i, x);

      // Position more drops in the bottom half
      const bottomHalfBias = Math.random() > 0.3; // 70% chance to be in bottom half
      drop.y = bottomHalfBias
        ? Math.random() * 50 + 50 // 50-100% (bottom half)
        : Math.random() * 50; // 0-50% (top half)

      initialRain.push(drop);
    }

    setDataRain(initialRain);
    scheduleNewDataRain();

    // Trigger a comet shortly after mounting
    setTimeout(() => {
      if (!isPaused && !cometCooldownRef.current) {
        triggerComet();
      }
    }, 2000);

    // Start animation cycle
    const animateElements = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(animateElements);
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

      // Animate data rain
      setDataRain((prev) => {
        return prev.map((drop) => {
          // Move drop down
          const newY = drop.y + drop.speed;

          // If it's gone far beyond the viewport, remove it (filtered out in scheduleNewDataRain)
          if (newY > 120) {
            return drop;
          }

          return {
            ...drop,
            y: newY,
          };
        });
      });

      // Animate comet if active
      if (comet.active && !isPaused) {
        setComet((prev) => {
          // Calculate new position based on angle and speed
          const radians = (prev.angle * Math.PI) / 180;
          const newX = prev.x + Math.cos(radians) * prev.speed * 10;
          const newY = prev.y + Math.sin(radians) * prev.speed * 10;

          // Deactivate if it goes off-screen
          if (newX < -20 || newY < -20) {
            return { ...prev, active: false };
          }

          return {
            ...prev,
            x: newX,
            y: newY,
          };
        });
      }

      animationFrameRef.current = requestAnimationFrame(animateElements);
    };

    animationFrameRef.current = requestAnimationFrame(animateElements);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (cometTimerRef.current) {
        clearTimeout(cometTimerRef.current);
      }
      if (dataRainRef.current) {
        clearTimeout(dataRainRef.current);
      }
    };
  }, [isPaused, comet.active]);

  // Function to create a new firefly with random properties - SLOW DOWN ANIMATIONS
  const createFirefly = (id: number): Firefly => {
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8 (reduced max opacity)
      duration: Math.random() * 10000 + 6000, // 6-16 seconds (increased from 4-12 seconds)
      delay: Date.now() + Math.random() * 5000,
    };
  };

  // Generate random binary/hex characters for data rain
  const getRandomDigit = () => {
    const chars = "01";
    return chars.charAt(Math.floor(Math.random() * chars.length));
  };

  return (
    <div
      className={styles.background}
      ref={containerRef}
      onMouseEnter={triggerCometEvent}
      onClick={triggerCometEvent}
    >
      {/* Neon glow spots */}
      {neonGlows.map((glow) => (
        <div
          key={`glow-${glow.id}`}
          className={styles.neonGlow}
          style={{
            left: `${glow.x}%`,
            top: `${glow.y}%`,
            width: `${glow.size}px`,
            height: `${glow.size}px`,
            animationDelay: `${glow.delay}ms`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      ))}

      {/* Digital Rain / Matrix Effect */}
      {dataRain.map((drop) => (
        <div
          key={`rain-${drop.id}`}
          className={styles.dataRain}
          style={{
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            height: `${drop.length}%`,
            opacity: drop.opacity,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {Array.from({ length: Math.floor(drop.length / 1.5) }, (_, i) => (
            <div key={i} className={styles.dataRainDigit}>
              {getRandomDigit()}
            </div>
          ))}
        </div>
      ))}

      {/* Code lines */}
      {codeLines.map((line) => (
        <div
          key={`line-${line.id}`}
          className={styles.codeLine}
          style={{
            top: `${line.y}%`,
            left: line.isFromLeft ? 0 : `${100 - line.width}%`,
            width: `${line.width}%`,
            animationDuration: `${line.speed}s`,
            animationDelay: `${line.delay}ms`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      ))}

      {/* Fireflies */}
      {fireflies.map((fly) => (
        <div
          key={`fly-${fly.id}`}
          className={styles.firefly}
          style={{
            left: `${fly.x}%`,
            top: `${fly.y}%`,
            width: `${fly.size}px`,
            height: `${fly.size}px`,
            opacity: fly.opacity,
            animationPlayState: isPaused ? "paused" : "running",
            animationDelay: `${(fly.id % 5) * 300}ms`,
          }}
        />
      ))}

      {/* Comet */}
      {comet.active && (
        <div
          className={styles.comet}
          style={{
            left: `${comet.x}%`,
            top: `${comet.y}%`,
            width: `${comet.size * 4}px`,
            height: `${comet.size * 1.2}px`,
            opacity: comet.opacity,
            transform: `rotate(${comet.angle}deg)`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      )}

      {/* Accessibility: Animation control */}
      <button
        onClick={toggleAnimation}
        className={styles.animationControl}
        aria-label={isPaused ? playLabel : pauseLabel}
        title={isPaused ? playLabel : pauseLabel}
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
