import React, { useEffect, useRef } from "react";
import styles from "./BackgroundAnimations.module.css";
import { translate } from "@docusaurus/Translate";
import {
  getThemeColors,
  getJsonSnippets,
  themeEmojis,
  getThemeEmojis,
  createKeyframesString,
  randomBetween,
} from "./utils";

interface BackgroundAnimationsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isPaused: boolean;
  colorMode: "dark" | "light";
}

export default function BackgroundAnimations({
  containerRef,
  isPaused,
  colorMode,
}: BackgroundAnimationsProps): React.ReactElement | null {
  const elementsRef = useRef<HTMLDivElement[]>([]);
  const firefliesRef = useRef<HTMLDivElement[]>([]);
  const emojisRef = useRef<HTMLDivElement[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const elements: HTMLDivElement[] = [];
    const fireflies: HTMLDivElement[] = [];
    const emojis: HTMLDivElement[] = [];
    let ufoElement: HTMLDivElement | null = null;

    // Number of elements to create
    const numElements = 16;
    const numFireflies = 24;
    const numEmojis = 10;

    // Create a virtual grid for initial positioning
    const gridRows = 4;
    const gridCols = 4;

    // Used snippets tracker to avoid duplicates in nearby cells
    const usedIndices = new Set<number>();

    // Choose color palette based on current theme
    const colors = getThemeColors(colorMode);

    // Get translated JSON snippets using the enhanced utility function
    const translatedSnippets = getJsonSnippets((id, message, description) =>
      translate({
        id,
        message,
        description,
      })
    );

    // Create faded emojis
    for (let i = 0; i < numEmojis; i++) {
      const emoji = document.createElement("div");
      emoji.className = styles.fadedEmoji;

      // Random position throughout the container
      emoji.style.top = `${Math.random() * 100}%`;
      emoji.style.left = `${Math.random() * 100}%`;

      // Select a random emoji from the theme set - using the regular emojis initially
      const emojiSet = themeEmojis; // Will be updated during flash mob
      const emojiIndex = Math.floor(Math.random() * emojiSet.length);
      emoji.textContent = emojiSet[emojiIndex];

      // Set a larger font size for the emojis
      emoji.style.fontSize = `${Math.random() * 2 + 2}rem`;

      // Very low opacity to keep them subtle
      emoji.style.opacity = (0.1 + Math.random() * 0.2).toString();

      // Add a blur effect to make them more ethereal
      emoji.style.filter = `blur(${Math.random() * 2 + 1}px)`;

      // Animation parameters for dreamlike movement
      const duration = Math.random() * 60 + 60;
      const delay = Math.random() * 15;

      emoji.style.animationDuration = `${duration}s, ${randomBetween(20, 50)}s`;
      emoji.style.animationDelay = `${delay}s, ${delay}s`;
      emoji.style.animationName = "emoji-float, emoji-fade";
      emoji.style.animationTimingFunction = "ease-in-out, ease-in-out";
      emoji.style.animationIterationCount = "infinite, infinite";
      emoji.style.animationDirection = "alternate, alternate";

      // Tag the duck and squirrel elements for later reference
      if (emojiSet[emojiIndex] === "🐿️") {
        emoji.id = "background-squirrel";
      } else if (emojiSet[emojiIndex] === "🦆") {
        emoji.id = "background-duck";
      }

      container.appendChild(emoji);
      emojis.push(emoji);
    }

    // Create fireflies
    for (let i = 0; i < numFireflies; i++) {
      const firefly = document.createElement("div");
      firefly.className = styles.firefly;

      // Random position throughout the container
      firefly.style.top = `${Math.random() * 100}%`;
      firefly.style.left = `${Math.random() * 100}%`;

      // Random size (small)
      const size = Math.random() * 6 + 3;
      firefly.style.width = `${size}px`;
      firefly.style.height = `${size}px`;

      // Random color based on our palette
      let color;
      if (colorMode === "light") {
        // For light mode, use blues, greens, and yellows
        const colorChoices = [
          "rgba(14, 165, 233, 0.7)", // Sky blue
          "rgba(34, 197, 94, 0.7)", // Green
          "rgba(234, 179, 8, 0.7)", // Yellow
          "rgba(255, 255, 255, 0.9)", // White
        ];
        color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      } else {
        // For dark mode, use purples and pinks
        const colorChoices = [
          "rgba(51, 41, 84, 0.7)", // Dark purple
          "rgba(107, 51, 105, 0.7)", // Mid purple
          "rgba(138, 52, 88, 0.7)", // Pink purple
          "rgba(255, 255, 255, 0.7)", // White
        ];
        color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      }

      firefly.style.backgroundColor = color;
      firefly.style.boxShadow = `0 0 ${
        size * 2
      }px ${color}, 0 0 ${size}px ${color}`;

      // Animation parameters for graceful movement
      const duration = Math.random() * 50 + 40;
      const delay = Math.random() * 10;

      firefly.style.animationDuration = `${duration}s, ${randomBetween(
        4,
        10
      )}s`;
      firefly.style.animationDelay = `${delay}s, ${delay}s`;
      firefly.style.animationName = "firefly-path, firefly-glow";

      container.appendChild(firefly);
      fireflies.push(firefly);
    }

    // Add some of our new hero-fireflies with enhanced glow effect
    for (let i = 0; i < 12; i++) {
      const glowFirefly = document.createElement("div");
      glowFirefly.className = styles.heroParticle;

      // Random positioning
      glowFirefly.style.top = `${Math.random() * 100}%`;
      glowFirefly.style.left = `${Math.random() * 100}%`;

      // Random size for varied effect
      const glowSize = Math.random() * 8 + 4;
      glowFirefly.style.width = `${glowSize}px`;
      glowFirefly.style.height = `${glowSize}px`;

      // Color based on theme
      let glowColor;
      if (colorMode === "light") {
        const glowOptions = [
          "rgba(255, 255, 255, 0.9)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(14, 165, 233, 0.8)",
        ];
        glowColor = glowOptions[Math.floor(Math.random() * glowOptions.length)];
      } else {
        const glowOptions = [
          "rgba(255, 255, 255, 0.9)",
          "rgba(107, 51, 105, 0.8)",
          "rgba(138, 52, 88, 0.8)",
        ];
        glowColor = glowOptions[Math.floor(Math.random() * glowOptions.length)];
      }

      glowFirefly.style.backgroundColor = glowColor;

      // Enhanced glow effect
      if (colorMode === "light") {
        glowFirefly.style.boxShadow = `0 0 ${
          glowSize * 2
        }px ${glowColor}, 0 0 ${glowSize * 3}px rgba(34, 197, 94, 0.6)`;
      } else {
        glowFirefly.style.boxShadow = `0 0 ${
          glowSize * 2
        }px ${glowColor}, 0 0 ${glowSize * 3}px rgba(138, 52, 88, 0.6)`;
      }

      // Animation timing
      const glowDuration = Math.random() * 6 + 3;
      const glowDelay = Math.random() * 4;

      glowFirefly.style.animationDuration = `${glowDuration}s`;
      glowFirefly.style.animationDelay = `${glowDelay}s`;

      container.appendChild(glowFirefly);
      fireflies.push(glowFirefly);
    }

    // Create JSON text elements
    for (let i = 0; i < numElements; i++) {
      const element = document.createElement("div");
      element.className = styles.jsonAnimation;

      // Calculate grid position for initial placement
      const row = Math.floor(i / gridCols);
      const col = i % gridCols;

      // Add some randomness within the cell
      const cellWidth = 100 / gridCols;
      const cellHeight = 100 / gridRows;

      // Position within the cell
      const xPos =
        cellWidth * col + cellWidth * 0.1 + Math.random() * cellWidth * 0.8;
      const yPos =
        cellHeight * row + cellHeight * 0.1 + Math.random() * cellHeight * 0.8;

      element.style.fontSize = `${Math.random() * 0.5 + 1}rem`;
      element.style.top = `${yPos}%`;
      element.style.left = `${xPos}%`;

      // Make it more faded by reducing opacity
      element.style.opacity = (0.2 + Math.random() * 0.3).toString();

      // Select a color for the element
      const colorIndex = Math.floor(Math.random() * colors.length);
      element.style.color = colors[colorIndex];

      // Make shadow more subtle
      element.style.textShadow = `0 0 8px ${colors[colorIndex].replace(
        ")",
        ", 0.2)"
      )}, 
                                0 0 15px ${colors[colorIndex].replace(
                                  ")",
                                  ", 0.1)"
                                )}`;

      // Select a snippet that hasn't been used recently
      let snippetIndex;
      do {
        snippetIndex = Math.floor(Math.random() * translatedSnippets.length);
      } while (
        usedIndices.has(snippetIndex) &&
        usedIndices.size < translatedSnippets.length / 2
      );

      usedIndices.add(snippetIndex);
      // Keep the set limited to recent snippets
      if (usedIndices.size > 5) {
        usedIndices.delete([...usedIndices][0]);
      }

      element.innerHTML = translatedSnippets[snippetIndex];

      // More graceful, dreamscape animation
      const duration = Math.random() * 40 + 50;
      const delay = Math.random() * 15;

      element.style.animationDuration = `${duration}s, ${randomBetween(
        15,
        35
      )}s, ${randomBetween(15, 40)}s`;
      element.style.animationDelay = `${delay}s, ${delay}s, ${delay}s`;
      element.style.animationName = "text-float, text-fade, text-rotate";
      element.style.animationTimingFunction =
        "ease-in-out, ease-in-out, ease-in-out";
      element.style.animationIterationCount = "infinite, infinite, infinite";
      element.style.animationDirection = "alternate, alternate, normal";

      // Add 3D transform for depth
      element.style.transform = `perspective(1000px) rotateX(${randomBetween(
        -5,
        5
      )}deg) rotateY(${randomBetween(-5, 5)}deg)`;

      container.appendChild(element);
      elements.push(element);
    }

    // Add CSS animations if they don't exist yet
    if (!document.getElementById("json-animations-css")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "json-animations-css";

      // Create keyframes string for animations
      styleSheet.textContent = createKeyframesString(colorMode);

      document.head.appendChild(styleSheet);
    }

    elementsRef.current = elements;
    firefliesRef.current = fireflies;
    emojisRef.current = emojis;

    // Add event listeners for jods logo hover to make JSON snippets more frenetic
    const jodsLogo = document.getElementById("jods-logo-trigger");

    const makeMoreFrenetic = () => {
      // Create a global flag to track hover state
      document.body.setAttribute("data-jods-hover", "true");

      // Create the UFO to pick up the duck and squirrel
      createEmojiUFO(container);

      // Make JSON elements move faster and more chaotically
      elements.forEach((element, index) => {
        // Store original animation properties for restoration
        if (!element.dataset.originalDuration) {
          element.dataset.originalDuration = element.style.animationDuration;
          element.dataset.originalDelay = element.style.animationDelay;
          element.dataset.originalOpacity = element.style.opacity;
          element.dataset.originalPosition = `${element.style.top},${element.style.left}`;
          element.dataset.originalTransform = element.style.transform;
          element.dataset.originalZIndex = element.style.zIndex;
          element.dataset.originalContent = element.innerHTML;
        }

        // Remove check for emojis - we'll handle them separately
        // Increase opacity and change animation to be more frenetic - make it pastier (60-70% opacity)
        element.style.opacity = (0.6 + Math.random() * 0.1).toString(); // Pasty look to see rainbow through it

        // Make sure they appear on top of the rainbow
        element.style.zIndex = "1000";

        // Add a text shadow to make them more visible against the rainbow
        const color = element.style.color;
        element.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px rgba(0,0,0,0.7)`;

        // Speed up the animations by reducing duration
        const durations = element.style.animationDuration.split(",");
        const newDurations = durations.map((d) => {
          const duration = parseFloat(d);
          return `${duration / 3}s`;
        });

        element.style.animationDuration = newDurations.join(",");

        // Create UFO-like oval flight paths with erratic movement
        // Remove the existing transform to apply our custom animation
        element.style.transform = "";

        // Generate a unique animation name for this element
        const animationName = `ufo-path-${index}`;

        // Calculate a random flight distance - make it larger to spread across screen
        const flightDistance = 150 + Math.random() * 300;
        const verticalDistance = 80 + Math.random() * 150;

        // Random speed variations (faster = more erratic)
        const speed = 3 + Math.random() * 4;
        const wobbleFrequency = 5 + Math.random() * 10;

        // Create the keyframe animation for a UFO-like oval path with wobbles
        const keyframes = `
          @keyframes ${animationName} {
            0% {
              transform: translate(0, 0) rotate(0deg);
            }
            10% {
              transform: translate(${flightDistance * 0.3}px, ${
          -verticalDistance * 0.2
        }px) rotate(${Math.random() * 40 - 20}deg);
            }
            25% {
              transform: translate(${flightDistance}px, ${-verticalDistance}px) rotate(${
          Math.random() * 80 - 40
        }deg);
            }
            30% {
              transform: translate(${flightDistance * 1.1}px, ${
          -verticalDistance * 0.9
        }px) rotate(${Math.random() * 60 - 30}deg);
            }
            50% {
              transform: translate(${flightDistance * 0.8}px, ${
          verticalDistance * 0.3
        }px) rotate(${Math.random() * 100 - 50}deg);
            }
            65% {
              transform: translate(${
                flightDistance * 0.5
              }px, ${verticalDistance}px) rotate(${Math.random() * 80 - 40}deg);
            }
            80% {
              transform: translate(${flightDistance * 0.3}px, ${
          verticalDistance * 0.7
        }px) rotate(${Math.random() * 60 - 30}deg);
            }
            90% {
              transform: translate(${flightDistance * 0.1}px, ${
          verticalDistance * 0.3
        }px) rotate(${Math.random() * 40 - 20}deg);
            }
            100% {
              transform: translate(0, 0) rotate(0deg);
            }
          }
          
          @keyframes ${animationName}-wobble {
            0%, 100% {
              margin-left: 0;
              margin-top: 0;
            }
            25% {
              margin-left: ${Math.random() * 10 - 5}px;
              margin-top: ${Math.random() * 10 - 5}px;
            }
            50% {
              margin-left: ${Math.random() * 15 - 7.5}px;
              margin-top: ${Math.random() * 15 - 7.5}px;
            }
            75% {
              margin-left: ${Math.random() * 10 - 5}px;
              margin-top: ${Math.random() * 10 - 5}px;
            }
          }
        `;

        // Add the keyframes to the document if not already present
        if (!document.getElementById(`ufo-keyframes-${index}`)) {
          const styleSheet = document.createElement("style");
          styleSheet.id = `ufo-keyframes-${index}`;
          styleSheet.textContent = keyframes;
          document.head.appendChild(styleSheet);
        } else {
          document.getElementById(`ufo-keyframes-${index}`).textContent =
            keyframes;
        }

        // Apply the animation
        element.style.animation = `${animationName} ${speed}s ease-in-out infinite alternate, ${animationName}-wobble ${
          wobbleFrequency / 10
        }s linear infinite`;
        element.style.position = "absolute";

        // Make the text larger for better visibility
        const currentSize = parseFloat(element.style.fontSize || "1rem");
        element.style.fontSize = `${currentSize * 1.4}rem`;

        // Add slight 3D perspective for more realism
        element.style.transformStyle = "preserve-3d";
        element.style.backfaceVisibility = "visible";

        // Add transition for smooth changes
        element.style.transition = "opacity 0.5s ease-out";
      });

      // Make fireflies faster and more erratic but at a lower z-index
      fireflies.forEach((firefly) => {
        if (!firefly.dataset.originalDuration) {
          firefly.dataset.originalDuration = firefly.style.animationDuration;
          firefly.dataset.originalDelay = firefly.style.animationDelay;
        }

        const durations = firefly.style.animationDuration.split(",");
        const newDurations = durations.map((d) => {
          const duration = parseFloat(d);
          return `${duration / 2.5}s`;
        });

        firefly.style.animationDuration = newDurations.join(",");

        // Make them brighter
        firefly.style.opacity = "1";

        // Enhance the glow effect
        const size = parseFloat(firefly.style.width || "5") * 1.5;
        const color = firefly.style.backgroundColor;
        firefly.style.boxShadow = `0 0 ${size * 3}px ${color}, 0 0 ${
          size * 5
        }px ${color}`;

        // Make sure fireflies are below the JSON snippets
        firefly.style.zIndex = "500";
      });

      // Make emojis spin and move faster, and replace some with disco balls
      emojis.forEach((emoji) => {
        if (!emoji.dataset.originalDuration) {
          emoji.dataset.originalDuration = emoji.style.animationDuration;
          emoji.dataset.originalOpacity = emoji.style.opacity;
          emoji.dataset.originalContent = emoji.textContent || "";
        }

        emoji.style.opacity = Math.min(
          0.7,
          parseFloat(emoji.style.opacity || "0.2") * 2
        ).toString();

        const durations = emoji.style.animationDuration.split(",");
        const newDurations = durations.map((d) => {
          const duration = parseFloat(d);
          return `${duration / 2}s`;
        });

        emoji.style.animationDuration = newDurations.join(",");
        emoji.style.animationTimingFunction = "linear, ease-in-out";

        // Add rotation
        emoji.style.transform = `rotate(${Math.random() * 360}deg) scale(${
          1 + Math.random() * 0.5
        })`;
        emoji.style.transition = "all 0.8s ease-out";

        // Replace some emojis with disco balls (except duck and squirrel)
        const id = emoji.id || "";
        if (!id.includes("duck") && !id.includes("squirrel")) {
          // Get the disco ball emojis
          const flashMobEmojis = getThemeEmojis(true);
          const regularEmojis = themeEmojis;

          // Find if this emoji matches one that should be replaced with a disco ball
          const currentEmoji = emoji.textContent || "";
          const regularIndex = regularEmojis.indexOf(currentEmoji);

          if (
            regularIndex >= 0 &&
            flashMobEmojis[regularIndex] !== regularEmojis[regularIndex]
          ) {
            // This is an emoji that should be replaced with a disco ball
            emoji.textContent = flashMobEmojis[regularIndex];

            // Add disco ball specific animations
            emoji.style.animation = `rotate 1.5s linear infinite`;
            const keyframes = `
              @keyframes rotate {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(180deg) scale(1.2); }
                100% { transform: rotate(360deg) scale(1); }
              }
            `;

            // Add the keyframes if they don't exist
            if (!document.getElementById("disco-ball-rotate")) {
              const styleSheet = document.createElement("style");
              styleSheet.id = "disco-ball-rotate";
              styleSheet.textContent = keyframes;
              document.head.appendChild(styleSheet);
            }
          }
        }
      });
    };

    // Function to create a special UFO animation that picks up duck and squirrel
    const createEmojiUFO = (container: HTMLDivElement) => {
      // Remove any existing UFO before creating a new one
      if (ufoElement) {
        if (ufoElement.parentNode) {
          ufoElement.parentNode.removeChild(ufoElement);
        }
        ufoElement = null;
      }

      // Find the duck and squirrel in the background
      const duckElement = document.getElementById("background-duck");
      const squirrelElement = document.getElementById("background-squirrel");

      // Store their positions for when we hide them
      let squirrelPosition = { top: "50%", left: "50%" };

      if (duckElement) {
        (duckElement as HTMLElement).style.display = "none";
      }

      if (squirrelElement) {
        (squirrelElement as HTMLElement).style.display = "none";
        squirrelPosition = {
          top: (squirrelElement as HTMLElement).style.top || "50%",
          left: (squirrelElement as HTMLElement).style.left || "50%",
        };
      }

      // Create the UFO element
      ufoElement = document.createElement("div");
      ufoElement.className = styles.emojiUFO;
      ufoElement.innerHTML = `
        <div class="emoji-ufo-container" style="position:absolute; z-index:2000; top:${squirrelPosition.top}; left:${squirrelPosition.left}; width:auto; height:auto;">
          <div class="emoji-ufo" style="position:relative; transform-origin:center; font-size:1.8em;">
            <span class="squirrel">🐿️</span>
            <span class="ufo" style="margin:0 5px; font-size:1.2em;">🛸</span>
            <span class="duck">🦆</span>
          </div>
        </div>
      `;

      // Generate a unique animation name for this UFO with a timestamp to ensure uniqueness
      const timestamp = Date.now();
      const ufoAnimName = `emoji-ufo-ride-${timestamp}`;

      // Define a more dramatic flight path for the UFO
      const maxDistance = Math.min(window.innerWidth, 1200); // Limit to screen width or 1200px
      const maxHeight = Math.min(window.innerHeight, 800); // Limit to screen height or 800px

      // Create a wide-ranging flying saucer animation with stops and turns
      const keyframes = `
        @keyframes ${ufoAnimName} {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          5% {
            transform: translate(50px, -30px) rotate(15deg) scale(1.1);
          }
          15% {
            transform: translate(${maxDistance * 0.25}px, -${
        maxHeight * 0.2
      }px) rotate(-10deg) scale(1.2);
          }
          20% {
            transform: translate(${maxDistance * 0.35}px, -${
        maxHeight * 0.15
      }px) rotate(5deg) scale(1.15);
          }
          30% {
            transform: translate(${maxDistance * 0.6}px, -${
        maxHeight * 0.1
      }px) rotate(-20deg) scale(1.3);
          }
          40% {
            transform: translate(${maxDistance * 0.5}px, ${
        maxHeight * 0.2
      }px) rotate(15deg) scale(1.2);
          }
          50% {
            transform: translate(${maxDistance * 0.3}px, ${
        maxHeight * 0.4
      }px) rotate(-10deg) scale(1.3);
          }
          60% {
            transform: translate(${maxDistance * 0.1}px, ${
        maxHeight * 0.3
      }px) rotate(5deg) scale(1.15);
          }
          70% {
            transform: translate(-${maxDistance * 0.2}px, ${
        maxHeight * 0.1
      }px) rotate(-15deg) scale(1.25);
          }
          80% {
            transform: translate(-${maxDistance * 0.4}px, -${
        maxHeight * 0.1
      }px) rotate(20deg) scale(1.2);
          }
          90% {
            transform: translate(-${maxDistance * 0.2}px, -${
        maxHeight * 0.2
      }px) rotate(-5deg) scale(1.1);
          }
          95% {
            transform: translate(-50px, -20px) rotate(10deg) scale(1.05);
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }
        
        @keyframes ${ufoAnimName}-squirrel {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(3px) rotate(5deg); }
        }
        
        @keyframes ${ufoAnimName}-duck {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(3px) rotate(5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(-5deg); }
        }
        
        @keyframes ${ufoAnimName}-ufo-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(120,255,255,0.5); }
          50% { text-shadow: 0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(120,255,255,0.7), 0 0 50px rgba(120,255,255,0.5); }
        }
        
        @keyframes ${ufoAnimName}-hover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `;

      // Create a new style element with the unique animation
      const styleSheet = document.createElement("style");
      styleSheet.id = `emoji-ufo-keyframes-${timestamp}`;
      styleSheet.textContent = keyframes;
      document.head.appendChild(styleSheet);

      // Add the UFO to the container
      container.appendChild(ufoElement);

      // Apply animations to the UFO and passengers
      const ufoContainer = ufoElement.querySelector(".emoji-ufo-container");
      const ufoAnimElement = ufoElement.querySelector(".emoji-ufo");
      const squirrel = ufoElement.querySelector(".squirrel");
      const duck = ufoElement.querySelector(".duck");
      const ufo = ufoElement.querySelector(".ufo");

      if (ufoContainer && ufoAnimElement && squirrel && duck && ufo) {
        // Make the whole UFO fly around the screen
        (
          ufoAnimElement as HTMLElement
        ).style.animation = `${ufoAnimName} 15s ease-in-out forwards`;

        // Make the UFO hover up and down slightly
        (
          ufoContainer as HTMLElement
        ).style.animation = `${ufoAnimName}-hover 4s ease-in-out infinite`;

        // Make the squirrel and duck bounce around slightly
        (squirrel as HTMLElement).style.display = "inline-block";
        (
          squirrel as HTMLElement
        ).style.animation = `${ufoAnimName}-squirrel 2s ease-in-out infinite`;

        (duck as HTMLElement).style.display = "inline-block";
        (
          duck as HTMLElement
        ).style.animation = `${ufoAnimName}-duck 2s ease-in-out infinite`;

        // Make the UFO glow
        (
          ufo as HTMLElement
        ).style.animation = `${ufoAnimName}-ufo-glow 3s ease-in-out infinite`;
      }
    };

    const restoreOriginal = () => {
      // Remove global hover flag
      document.body.removeAttribute("data-jods-hover");

      // Clean up the UFO and restore duck and squirrel
      if (ufoElement) {
        // Hide the UFO with a fade out effect
        ufoElement.style.opacity = "0";

        // After fade out completes, remove the UFO and clean up
        setTimeout(() => {
          // Remove the UFO element
          if (ufoElement && ufoElement.parentNode) {
            ufoElement.parentNode.removeChild(ufoElement);
            ufoElement = null;
          }

          // Remove all UFO keyframe styles
          document
            .querySelectorAll('[id^="emoji-ufo-keyframes-"]')
            .forEach((el) => {
              el.parentNode?.removeChild(el);
            });

          // Show duck and squirrel again
          const duckElement = document.getElementById("background-duck");
          const squirrelElement = document.getElementById(
            "background-squirrel"
          );

          if (duckElement) {
            (duckElement as HTMLElement).style.display = "block";
          }

          if (squirrelElement) {
            (squirrelElement as HTMLElement).style.display = "block";
          }
        }, 300); // Match the transition duration
      }

      // Restore JSON elements to original state
      elements.forEach((element, index) => {
        if (element.dataset.originalDuration) {
          // Remove the UFO animation
          element.style.animation = "";

          // Restore original content if changed
          if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
          }

          // Restore original properties
          element.style.animationDuration = element.dataset.originalDuration;
          element.style.animationDelay = element.dataset.originalDelay;
          element.style.opacity = element.dataset.originalOpacity;
          element.style.zIndex = element.dataset.originalZIndex || "auto";

          // Remove the text shadow
          element.style.textShadow = "";

          // Restore original size
          const currentSize = parseFloat(element.style.fontSize || "1rem");
          element.style.fontSize = `${currentSize / 1.4}rem`;

          if (element.dataset.originalPosition) {
            const [top, left] = element.dataset.originalPosition.split(",");
            element.style.top = top;
            element.style.left = left;
          }

          element.style.transform =
            element.dataset.originalTransform ||
            `perspective(1000px) rotateX(${randomBetween(
              -5,
              5
            )}deg) rotateY(${randomBetween(-5, 5)}deg)`;

          // Remove custom animation styles
          const styleSheet = document.getElementById(`ufo-keyframes-${index}`);
          if (styleSheet) {
            styleSheet.remove();
          }

          // Also remove emoji UFO styles
          const emojiStyleSheet = document.getElementById(
            "emoji-ufo-keyframes"
          );
          if (emojiStyleSheet) {
            emojiStyleSheet.remove();
          }

          // Restore animation properties
          element.style.animationName = "text-float, text-fade, text-rotate";
          element.style.animationTimingFunction =
            "ease-in-out, ease-in-out, ease-in-out";
          element.style.animationIterationCount =
            "infinite, infinite, infinite";
          element.style.animationDirection = "alternate, alternate, normal";
        }
      });

      // Restore fireflies
      fireflies.forEach((firefly) => {
        if (firefly.dataset.originalDuration) {
          firefly.style.animationDuration = firefly.dataset.originalDuration;
          firefly.style.animationDelay = firefly.dataset.originalDelay;

          // Restore glow to original
          const size = parseFloat(firefly.style.width || "5");
          const color = firefly.style.backgroundColor;
          if (colorMode === "light") {
            firefly.style.boxShadow = `0 0 ${size * 2}px ${color}, 0 0 ${
              size * 3
            }px rgba(34, 197, 94, 0.6)`;
          } else {
            firefly.style.boxShadow = `0 0 ${size * 2}px ${color}, 0 0 ${
              size * 3
            }px rgba(138, 52, 88, 0.6)`;
          }
        }
      });

      // Restore emojis
      emojis.forEach((emoji) => {
        if (emoji.dataset.originalDuration) {
          emoji.style.animationDuration = emoji.dataset.originalDuration;
          emoji.style.opacity = emoji.dataset.originalOpacity;
          emoji.style.animationTimingFunction = "ease-in-out, ease-in-out";
          emoji.style.transform = "";

          // Restore original emoji if it was changed to a disco ball
          if (
            emoji.dataset.originalContent &&
            emoji.dataset.originalContent !== emoji.textContent
          ) {
            emoji.textContent = emoji.dataset.originalContent;
            emoji.style.animation = ""; // Remove any custom disco ball animation
          }
        }
      });

      // Remove disco ball animations
      const discoStyleSheet = document.getElementById("disco-ball-rotate");
      if (discoStyleSheet) {
        discoStyleSheet.remove();
      }
    };

    // Set up the event listeners with proper reference to the functions
    if (jodsLogo) {
      // Use proper bound functions to ensure we have the right context
      const boundMakeMoreFrenetic = makeMoreFrenetic.bind(this);
      const boundRestoreOriginal = restoreOriginal.bind(this);

      // Remove any existing listeners to prevent duplication
      jodsLogo.removeEventListener("mouseenter", boundMakeMoreFrenetic);
      jodsLogo.removeEventListener("mouseleave", boundRestoreOriginal);
      jodsLogo.removeEventListener("click", boundRestoreOriginal);

      // Add new listeners
      jodsLogo.addEventListener("mouseenter", boundMakeMoreFrenetic);
      jodsLogo.addEventListener("mouseleave", boundRestoreOriginal);
      jodsLogo.addEventListener("click", boundRestoreOriginal);
    }

    // Subtle animation effects for dreamlike quality
    animationRef.current = setInterval(() => {
      if (isPaused) return;

      // Update JSON elements opacity
      elements.forEach((element) => {
        const currentOpacity = parseFloat(element.style.opacity || "0.3");
        const opacityChange = Math.random() * 0.1 - 0.05;
        const newOpacity = Math.max(
          0.1,
          Math.min(0.5, currentOpacity + opacityChange)
        );
        element.style.opacity = newOpacity.toString();
      });

      // Update emoji opacity
      emojis.forEach((emoji) => {
        const currentOpacity = parseFloat(emoji.style.opacity || "0.2");
        const opacityChange = Math.random() * 0.05 - 0.025;
        const newOpacity = Math.max(
          0.1,
          Math.min(0.3, currentOpacity + opacityChange)
        );
        emoji.style.opacity = newOpacity.toString();
      });

      // Update firefly opacity and size
      fireflies.forEach((firefly) => {
        const currentOpacity = parseFloat(firefly.style.opacity || "0.5");
        const opacityChange = Math.random() * 0.3 - 0.15;
        const newOpacity = Math.max(
          0.2,
          Math.min(0.9, currentOpacity + opacityChange)
        );
        firefly.style.opacity = newOpacity.toString();

        // Occasionally change size slightly
        if (Math.random() > 0.7) {
          const size =
            parseFloat(firefly.style.width || "5") *
            (0.9 + Math.random() * 0.2);
          firefly.style.width = `${size}px`;
          firefly.style.height = `${size}px`;
        }
      });
    }, 2000);

    // Cleanup function
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }

      // Properly remove event listeners with the same function reference
      if (jodsLogo) {
        const boundMakeMoreFrenetic = makeMoreFrenetic.bind(this);
        const boundRestoreOriginal = restoreOriginal.bind(this);

        jodsLogo.removeEventListener("mouseenter", boundMakeMoreFrenetic);
        jodsLogo.removeEventListener("mouseleave", boundRestoreOriginal);
        jodsLogo.removeEventListener("click", boundRestoreOriginal);
      }

      // Clean up the UFO element and keyframes
      if (ufoElement && ufoElement.parentNode) {
        ufoElement.parentNode.removeChild(ufoElement);
      }

      const ufoStyleSheet = document.getElementById("emoji-ufo-keyframes");
      if (ufoStyleSheet) {
        ufoStyleSheet.remove();
      }

      // Remove any UFO animation stylesheets
      elements.forEach((_, index) => {
        const styleSheet = document.getElementById(`ufo-keyframes-${index}`);
        if (styleSheet) {
          styleSheet.remove();
        }
      });

      [...elements, ...fireflies, ...emojis].forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      const styleElement = document.getElementById("json-animations-css");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [containerRef, colorMode, isPaused]);

  // This component doesn't render anything directly, it just adds elements to the DOM
  return null;
}
