import React, { useEffect, useState, createContext, useContext } from "react";
import useIsBrowser from "@docusaurus/useIsBrowser";

// Create a context for animation state
export const AnimationContext = createContext({
  isPaused: false,
  toggleAnimation: () => {},
});

// Custom hook to use animation state
export const useAnimationState = () => useContext(AnimationContext);

export function AnimationProvider({ children }) {
  const [isPaused, setIsPaused] = useState(false);
  const isBrowser = useIsBrowser();

  // Toggle animation state
  const toggleAnimation = () => {
    setIsPaused((prev) => !prev);
  };

  // Apply or remove the class from the html element when paused state changes
  useEffect(() => {
    if (!isBrowser) return;

    const htmlElement = document.documentElement;

    if (isPaused) {
      htmlElement.classList.add("animations-paused");
      // Store the preference in localStorage
      localStorage.setItem("jods-animations-paused", "true");
    } else {
      htmlElement.classList.remove("animations-paused");
      // Remove the preference from localStorage
      localStorage.setItem("jods-animations-paused", "false");
    }
  }, [isPaused, isBrowser]);

  // Check localStorage on initial render to restore user preference
  useEffect(() => {
    if (!isBrowser) return;

    const savedPreference = localStorage.getItem("jods-animations-paused");
    if (savedPreference === "true") {
      setIsPaused(true);
    }

    // Also respect user OS preference for reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (prefersReducedMotion.matches && savedPreference !== "false") {
      setIsPaused(true);
    }

    // Listen for changes to OS reduce motion setting
    const handleReducedMotionChange = (e) => {
      if (
        e.matches &&
        localStorage.getItem("jods-animations-paused") !== "false"
      ) {
        setIsPaused(true);
      }
    };

    prefersReducedMotion.addEventListener("change", handleReducedMotionChange);

    return () => {
      prefersReducedMotion.removeEventListener(
        "change",
        handleReducedMotionChange
      );
    };
  }, [isBrowser]);

  return (
    <AnimationContext.Provider value={{ isPaused, toggleAnimation }}>
      {children}
    </AnimationContext.Provider>
  );
}

// The global animation control button is no longer needed
// as we'll have local buttons in the hero and footer sections
export default function AnimationPauseControl(): React.ReactElement | null {
  return null;
}
