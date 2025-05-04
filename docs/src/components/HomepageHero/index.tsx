import React, { useEffect, useRef, useState } from "react";
import useIsBrowser from "@docusaurus/useIsBrowser";
import HeroContent from "./HeroContent";
import Mascots from "./Mascots";
import AnimationControls from "./AnimationControls";
import BackgroundAnimations from "./BackgroundAnimations";
import "./styles.css";

export default function HomepageHero(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isBrowser = useIsBrowser();
  const [colorMode, setColorMode] = useState<"dark" | "light">("light");
  const [mascotsInteracting, setMascotsInteracting] = useState(false);

  // Detect color mode on client side
  useEffect(() => {
    if (isBrowser) {
      // Check if dark mode is enabled
      const isDarkMode = document.documentElement.dataset.theme === "dark";
      setColorMode(isDarkMode ? "dark" : "light");

      // Listen for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "data-theme") {
            const newTheme =
              document.documentElement.dataset.theme === "dark"
                ? "dark"
                : "light";
            setColorMode(newTheme);
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });

      return () => observer.disconnect();
    }
  }, [isBrowser]);

  const toggleAnimation = () => {
    setIsPaused((prev) => {
      const newState = !prev;

      if (containerRef.current) {
        const elements = containerRef.current.querySelectorAll<HTMLDivElement>(
          ".json-animation, .firefly, .hero__mascot"
        );
        elements.forEach((el) => {
          if (newState) {
            // Pause by storing current animation state
            el.style.animationPlayState = "paused";
          } else {
            // Resume animation
            el.style.animationPlayState = "running";
          }
        });

        // Reset mascot interaction when pausing
        if (newState) {
          setMascotsInteracting(false);
        }
      }

      return newState;
    });
  };

  // Function to correctly handle speech bubble orientations
  const handleMascotHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const transform = window.getComputedStyle(element).transform;

    // If mascot is flipped, make sure speech bubble faces the right direction
    const speechBubble = element.querySelector(
      ".speech-bubble"
    ) as HTMLDivElement;
    if (speechBubble) {
      // Check if the mascot is flipped (rotateY around 180deg)
      if (
        transform.includes("matrix") &&
        transform.split(",")[0].includes("-")
      ) {
        // If mascot is flipped, counter-rotate the speech bubble
        speechBubble.style.transform = "rotateY(180deg)";
      } else {
        // If mascot is normal, keep speech bubble normal
        speechBubble.style.transform = "rotateY(0deg)";
      }
    }
  };

  return (
    <div className="hero-container" ref={containerRef}>
      {/* Background animations (JSON, emojis, fireflies) */}
      <BackgroundAnimations
        containerRef={containerRef}
        isPaused={isPaused}
        colorMode={colorMode}
      />

      {/* Main hero content */}
      <HeroContent />

      {/* Animated Mascots */}
      <Mascots
        mascotsInteracting={mascotsInteracting}
        setMascotsInteracting={setMascotsInteracting}
        handleMascotHover={handleMascotHover}
      />

      {/* Animation controls */}
      <AnimationControls
        isPaused={isPaused}
        toggleAnimation={toggleAnimation}
      />
    </div>
  );
}
