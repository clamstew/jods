import React, { useState, useRef } from "react";
import Mascots from "./Mascots";
import { useAnimationState } from "../AnimationPauseControl";
import "./styles.css";

// Existing component imports
import HeroContent from "./HeroContent";
import AnimationControls from "./AnimationControls";
import BackgroundAnimations from "./BackgroundAnimations";

export default function HomepageHero(): React.ReactElement {
  const [mascotsInteracting, setMascotsInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPaused } = useAnimationState();
  const isDarkTheme = document.documentElement.dataset.theme === "dark";

  // Handle mascot hover effect
  const handleMascotHover = (_e: React.MouseEvent<HTMLDivElement>) => {
    // Add any hover logic here
  };

  return (
    <div
      className="hero-container"
      ref={containerRef}
      data-testid="jods-hero-section"
    >
      {/* Background animations (JSON, emojis, fireflies) */}
      <BackgroundAnimations
        containerRef={containerRef}
        isPaused={isPaused}
        colorMode={isDarkTheme ? "dark" : "light"}
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
      <AnimationControls />
    </div>
  );
}
