import React, { useState, useRef, useEffect } from "react";
import Mascots from "./Mascots";
import { useAnimationState } from "../AnimationPauseControl";
import useIsBrowser from "@docusaurus/useIsBrowser";
import styles from "./index.module.css";

// Existing component imports
import HeroContent from "./HeroContent";
import AnimationControls from "./AnimationControls";
import BackgroundAnimations from "./BackgroundAnimations";

export default function HomepageHero(): React.ReactElement {
  const [mascotsInteracting, setMascotsInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPaused } = useAnimationState();
  const isBrowser = useIsBrowser();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Check theme on client-side only
  useEffect(() => {
    if (isBrowser) {
      setIsDarkTheme(document.documentElement.dataset.theme === "dark");

      // Optional: Add theme change listener
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "data-theme") {
            setIsDarkTheme(document.documentElement.dataset.theme === "dark");
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }
  }, [isBrowser]);

  // Handle mascot hover effect
  const handleMascotHover = (_e: React.MouseEvent<HTMLDivElement>) => {
    // Add any hover logic here
  };

  return (
    <div
      className={styles.heroContainer}
      ref={containerRef}
      data-testid="jods-hero-section"
    >
      {/* Background animations (JSON, emojis, fireflies) */}
      {isBrowser && (
        <BackgroundAnimations
          containerRef={containerRef}
          isPaused={isPaused}
          colorMode={isDarkTheme ? "dark" : "light"}
        />
      )}

      {/* Main hero content - now with built-in animations on jods logo */}
      <HeroContent />

      {/* Animated Mascots */}
      <Mascots
        mascotsInteracting={mascotsInteracting}
        setMascotsInteracting={setMascotsInteracting}
        handleMascotHover={handleMascotHover}
      />

      {/* Animation controls */}
      <AnimationControls />
    </div>
  );
}
