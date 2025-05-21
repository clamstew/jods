import React, { useRef, useEffect, useState } from "react";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";
import styles from "./HeroContent.module.css";
import { useColorMode } from "@docusaurus/theme-common/internal";

export default function HeroContent(): React.ReactElement {
  const heroContentRef = useRef<HTMLDivElement>(null);
  const jodsLogoRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { colorMode } = useColorMode();
  const isDarkTheme = colorMode === "dark";
  const [isFlashMobActive, setIsFlashMobActive] = useState(false);

  useEffect(() => {
    if (!heroContentRef.current || !svgRef.current) return;

    // Add event handlers directly to the logo element
    const jodsLogo = document.getElementById("jods-logo-trigger");
    if (jodsLogo) {
      let animationResetTimeout: NodeJS.Timeout | null = null;

      // Flash mob animation trigger function
      const triggerFlashMob = () => {
        // Set the state to active
        setIsFlashMobActive(true);

        // Reset animations before starting
        resetAnimations();

        // Dispatch event to start animations
        dispatchEvent("flashmob");

        // Set timeout to end the flash mob after 12 seconds
        setTimeout(() => {
          setIsFlashMobActive(false);
          resetAnimations();
        }, 12000);
      };

      // Simple event dispatcher for animation triggers
      const dispatchEvent = (type: string) => {
        const svgElements = document.querySelectorAll(".jodsFireworks");
        svgElements.forEach((el) => {
          if (type === "mouseenter" || type === "flashmob") {
            (el as HTMLElement).style.opacity = "1";
          } else {
            (el as HTMLElement).style.opacity = "0";
          }
        });

        // Create and dispatch the proper mouse event
        const event = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
        });

        // Dispatch to all elements that need animation triggering
        if (svgRef.current) {
          // For mouseenter or flashmob, trigger mascot and rainbow animations
          if (type === "mouseenter" || type === "flashmob") {
            // Restart mascot animations
            const mascots = svgRef.current.querySelectorAll(
              ".mascotUfo, .mascotDuck, .mascotSquirrel"
            );
            mascots.forEach((mascot) => {
              // Reset attributes
              (mascot as SVGElement).setAttribute("opacity", "1"); // Set to 1 for better visibility
              (mascot as SVGElement).setAttribute(
                "transform",
                "translate(400, 250)"
              );

              // Force restart all animations
              mascot
                .querySelectorAll("animate, animateMotion, animateTransform")
                .forEach((anim) => {
                  try {
                    // End any current animation
                    (anim as any).endElement();

                    // Restart with a tiny delay to ensure proper sequencing
                    setTimeout(() => {
                      try {
                        (anim as any).beginElement();
                      } catch (e) {
                        // Some browsers might not support this
                      }
                    }, 10);
                  } catch (e) {
                    // Some browsers might not support this
                  }
                });
            });

            // Restart rainbow burst animations
            const rainbowBursts =
              svgRef.current.querySelectorAll(".rainbowBurst");
            rainbowBursts.forEach((burst, index) => {
              // Reset attributes
              (burst as SVGElement).setAttribute("r", "0");
              (burst as SVGElement).setAttribute("opacity", "0");

              // Force restart all animations with staggered timing
              burst.querySelectorAll("animate").forEach((anim) => {
                try {
                  // End any current animation
                  (anim as any).endElement();

                  // Restart with staggered timing
                  setTimeout(() => {
                    try {
                      (anim as any).beginElement();
                    } catch (e) {
                      // Some browsers might not support this
                    }
                  }, index * 300);
                } catch (e) {
                  // Some browsers might not support this
                }
              });
            });
          }

          // Dispatch event to all elements with matching begin attributes
          svgRef.current
            .querySelectorAll(`svg *[begin*="jods-logo-trigger.${type}"]`)
            .forEach((el) => el.dispatchEvent(event));
        }
      };

      // Unified animation reset function
      const resetAnimations = () => {
        // Clear any existing timeout
        if (animationResetTimeout) {
          clearTimeout(animationResetTimeout);
          animationResetTimeout = null;
        }

        // Reset all animation elements
        const elements = svgRef.current?.querySelectorAll(
          ".mascotUfo, .mascotDuck, .mascotSquirrel, .rainbowBursts circle, .fireworkBursts circle, .fireworkTrail, .explosiveParticle, .sparkle, .flyingCode"
        );

        if (elements) {
          elements.forEach((el) => {
            // Reset opacity
            (el as SVGElement).setAttribute("opacity", "0");

            // Reset transforms for mascots
            if (
              (el as SVGElement).classList.contains("mascotUfo") ||
              (el as SVGElement).classList.contains("mascotDuck") ||
              (el as SVGElement).classList.contains("mascotSquirrel")
            ) {
              (el as SVGElement).setAttribute(
                "transform",
                "translate(400, 250)"
              );
            }

            // Reset radius for burst animations
            if ((el as SVGElement).classList.contains("rainbowBurst")) {
              (el as SVGElement).setAttribute("r", "0");
            }

            // End all child animations
            el.querySelectorAll(
              "animate, animateMotion, animateTransform"
            ).forEach((anim) => {
              try {
                (anim as any).endElement();
              } catch (e) {
                // Some browsers might not support this
              }
            });
          });
        }
      };

      // Mouseenter - trigger animations
      jodsLogo.addEventListener("mouseenter", () => {
        resetAnimations();
        dispatchEvent("mouseenter");
      });

      // Mouseleave - stop animations
      jodsLogo.addEventListener("mouseleave", () => {
        dispatchEvent("mouseleave");

        // Force complete reset after a short delay
        animationResetTimeout = setTimeout(() => resetAnimations(), 300);
      });

      // Click - reset animations
      jodsLogo.addEventListener("click", () => {
        dispatchEvent("mouseleave");
        resetAnimations();
      });

      // Double-click - trigger flash mob
      jodsLogo.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (!isFlashMobActive) {
          triggerFlashMob();
        }
      });

      // Initial reset to ensure clean state
      resetAnimations();
    }

    return () => {
      // Cleanup event listeners if needed
      const jodsLogo = document.getElementById("jods-logo-trigger");
      if (jodsLogo) {
        jodsLogo.removeEventListener("mouseenter", () => {});
        jodsLogo.removeEventListener("mouseleave", () => {});
        jodsLogo.removeEventListener("click", () => {});
        jodsLogo.removeEventListener("dblclick", () => {});
      }
    };
  }, [isDarkTheme, isFlashMobActive]);

  return (
    <div className={styles.heroContent} ref={heroContentRef}>
      <div className={styles.signalsContainer}>
        <svg
          className={styles.signalsSvg}
          viewBox="0 0 800 500"
          xmlns="http://www.w3.org/2000/svg"
          ref={svgRef}
        >
          <defs>
            <radialGradient id="signalGlow" cx="0.5" cy="0.5" r="0.5">
              <stop
                offset="0%"
                stopColor={isDarkTheme ? "#FFFA96" : "#FFE03A"}
                stopOpacity="0.9"
              />
              <stop
                offset="100%"
                stopColor={isDarkTheme ? "#FFDF00" : "#FFC800"}
                stopOpacity="0"
              />
            </radialGradient>

            <filter
              id="blurFilter"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>

            <circle
              id="dotTemplate"
              r="3"
              fill={isDarkTheme ? "#FFFA96" : "#FFE03A"}
            />

            <radialGradient id="fireworksGlow1" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FF5E5E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="fireworksGlow2" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#5EFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="fireworksGlow3" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFFA96" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFDF00" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="fireworksGlow4" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FF96FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF00FF" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="fireworksGlow5" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#96FF96" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00FF00" stopOpacity="0" />
            </radialGradient>

            <filter id="glow1" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="5"
                result="blur"
              />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="10"
                result="blur"
              />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Rainbow gradients */}
            <radialGradient id="rainbowGlow1" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FF5E5E" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#FFFA96" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#96FF96" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#5EFFFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF96FF" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="rainbowGlow2" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#5EFFFF" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#96FF96" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFFA96" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#FF96FF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF5E5E" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="rainbowGlow3" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFFA96" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#FF96FF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#5EFFFF" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#FF5E5E" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#96FF96" stopOpacity="0" />
            </radialGradient>

            {/* Flash Mob specific gradients and effects */}
            <radialGradient id="partyGlow1" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FF5E5E" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="partyGlow2" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#5EFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
            </radialGradient>

            <filter id="partyGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="15"
                result="blur"
              />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Enhanced sunburst-style rainbow gradient */}
            <radialGradient id="sunburstRainbow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="10%" stopColor="#FFFA96" stopOpacity="0.7" />
              <stop offset="20%" stopColor="#FF96FF" stopOpacity="0.6" />
              <stop offset="30%" stopColor="#5EFFFF" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#96FF96" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#FF5E5E" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#FFAA55" stopOpacity="0.2" />
              <stop offset="90%" stopColor="#FFFA96" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            <filter
              id="sunburstBlur"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="30"
                result="blur"
              />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Supernova-style gradient with more subtle blue/green/yellow tones */}
            <radialGradient id="supernovaGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="5%" stopColor="#E0F7FF" stopOpacity="0.9" />
              <stop offset="15%" stopColor="#A6E8FF" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#7BCEFF" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#76DDFF" stopOpacity="0.6" />
              <stop offset="45%" stopColor="#93EEDB" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#A8FFB2" stopOpacity="0.4" />
              <stop offset="65%" stopColor="#D0FFB2" stopOpacity="0.3" />
              <stop offset="75%" stopColor="#F0FF9E" stopOpacity="0.2" />
              <stop offset="85%" stopColor="#FFFDC0" stopOpacity="0.1" />
              <stop offset="95%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            <filter
              id="supernovaBlur"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="40"
                result="blur"
              />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g className={styles.signalElements}>
            {/* Main burst points */}
            <circle
              cx="400"
              cy="250"
              r="8"
              fill="url(#signalGlow)"
              className={styles.burstCenter}
            >
              <animate
                attributeName="r"
                values="8;40;8"
                dur="3s"
                repeatCount="indefinite"
                begin="0s; mouseover"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.3;0.9"
                dur="3s"
                repeatCount="indefinite"
                begin="0s; mouseover"
              />
              <animate
                attributeName="r"
                values="8;80;8"
                dur="1.5s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.6;0.9"
                dur="1.5s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
            </circle>

            <circle
              cx="200"
              cy="100"
              r="5"
              fill="url(#signalGlow)"
              className={styles.burstCenter}
            >
              <animate
                attributeName="r"
                values="5;30;5"
                dur="2.5s"
                repeatCount="indefinite"
                begin="0.3s; mouseover+0.3s"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.3;0.9"
                dur="2.5s"
                repeatCount="indefinite"
                begin="0.3s; mouseover+0.3s"
              />
              <animate
                attributeName="r"
                values="5;60;5"
                dur="1.2s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.1s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.6;0.9"
                dur="1.2s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.1s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
            </circle>

            {/* More burst circles */}
            <circle
              cx="600"
              cy="100"
              r="5"
              fill="url(#signalGlow)"
              className={styles.burstCenter}
            >
              <animate
                attributeName="r"
                values="5;30;5"
                dur="2.7s"
                repeatCount="indefinite"
                begin="0.5s; mouseover+0.5s"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.3;0.9"
                dur="2.7s"
                repeatCount="indefinite"
                begin="0.5s; mouseover+0.5s"
              />
              <animate
                attributeName="r"
                values="5;60;5"
                dur="1.3s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.2s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.6;0.9"
                dur="1.3s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.2s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
            </circle>

            <circle
              cx="150"
              cy="400"
              r="5"
              fill="url(#signalGlow)"
              className={styles.burstCenter}
            >
              <animate
                attributeName="r"
                values="5;25;5"
                dur="2.3s"
                repeatCount="indefinite"
                begin="0.7s; mouseover+0.7s"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.3;0.9"
                dur="2.3s"
                repeatCount="indefinite"
                begin="0.7s; mouseover+0.7s"
              />
              <animate
                attributeName="r"
                values="5;50;5"
                dur="1.1s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.3s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.6;0.9"
                dur="1.1s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.3s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
            </circle>

            <circle
              cx="650"
              cy="400"
              r="5"
              fill="url(#signalGlow)"
              className={styles.burstCenter}
            >
              <animate
                attributeName="r"
                values="5;25;5"
                dur="2.1s"
                repeatCount="indefinite"
                begin="0.2s; mouseover+0.2s"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.3;0.9"
                dur="2.1s"
                repeatCount="indefinite"
                begin="0.2s; mouseover+0.2s"
              />
              <animate
                attributeName="r"
                values="5;50;5"
                dur="1.4s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.15s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
              <animate
                attributeName="opacity"
                values="0.9;0.6;0.9"
                dur="1.4s"
                repeatCount="indefinite"
                begin="jods-logo-trigger.mouseenter+0.15s"
                end="jods-logo-trigger.mouseleave+0.1s; jods-logo-trigger.click"
              />
            </circle>

            {/* Signal beams and other animations */}
            {/* ... */}

            {/* Mascot Animations */}
            <g className="mascotAnimations">
              {/* UFO Mascot */}
              <g
                className="mascotUfo"
                opacity="0"
                transform="translate(400, 250)"
              >
                <circle cx="0" cy="0" r="12" fill="#5A5A9F" />
                <ellipse cx="0" cy="3" rx="20" ry="6" fill="#7F7FD5" />
                <circle cx="0" cy="-5" r="6" fill="#E0E0FF" />

                {/* Animation for hover */}
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="6s"
                  begin="jods-logo-trigger.mouseenter"
                  end="jods-logo-trigger.mouseleave+0.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
                <animateMotion
                  path="M0,0 C-150,-70 -250,100 -350,0 C-400,-50 -300,-150 -200,-100 C-100,-150 0,-50 0,0"
                  dur="6s"
                  begin="jods-logo-trigger.mouseenter"
                  end="jods-logo-trigger.mouseleave+0.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />

                {/* Flash mob animations */}
                <animate
                  attributeName="opacity"
                  values="0;1;1;1;0"
                  dur="10s"
                  begin="jods-logo-trigger.dblclick+0.5s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
                <animateMotion
                  path="M0,0 C-200,-100 -300,100 -400,-50 C-450,50 -350,150 -250,100 C-150,150 -50,100 0,0"
                  dur="10s"
                  begin="jods-logo-trigger.dblclick+0.5s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
              </g>

              {/* Duck Mascot */}
              <g
                className="mascotDuck"
                opacity="0"
                transform="translate(400, 250)"
              >
                <path
                  d="M0,0 Q5,-10 15,-5 Q25,-10 25,0 Q25,10 15,15 Q5,10 0,0"
                  fill="#FFD700"
                />
                <circle cx="18" cy="-2" r="2" fill="#000" />
                <path d="M10,0 L25,0" stroke="#FF6600" strokeWidth="3" />

                {/* Animation for hover */}
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="5.5s"
                  begin="jods-logo-trigger.mouseenter+0.3s"
                  end="jods-logo-trigger.mouseleave+0.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
                <animateMotion
                  path="M0,0 C150,-100 250,50 350,-50 C400,0 300,100 200,50 C100,100 0,50 0,0"
                  dur="5.5s"
                  begin="jods-logo-trigger.mouseenter+0.3s"
                  end="jods-logo-trigger.mouseleave+0.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />

                {/* Flash mob animations */}
                <animate
                  attributeName="opacity"
                  values="0;1;1;1;0"
                  dur="9s"
                  begin="jods-logo-trigger.dblclick+1.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
                <animateMotion
                  path="M0,0 C200,-150 350,50 450,-50 C500,0 400,100 300,50 C200,100 100,50 0,0"
                  dur="9s"
                  begin="jods-logo-trigger.dblclick+1.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
              </g>

              {/* Squirrel Mascot */}
              <g
                className="mascotSquirrel"
                opacity="0"
                transform="translate(400, 250)"
              >
                <path d="M0,0 Q-5,-10 0,-20 Q5,-10 0,0" fill="#8B4513" />
                <circle cx="0" cy="-5" r="7" fill="#A0522D" />
                <circle cx="-3" cy="-7" r="1" fill="#000" />
                <circle cx="3" cy="-7" r="1" fill="#000" />
                <path
                  d="M-3,-3 Q0,-1 3,-3"
                  stroke="#000"
                  strokeWidth="0.5"
                  fill="none"
                />
                <path
                  d="M0,-5 Q5,10 10,15"
                  stroke="#8B4513"
                  strokeWidth="2"
                  fill="none"
                />

                {/* Animation for hover */}
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="5s"
                  begin="jods-logo-trigger.mouseenter+0.6s"
                  end="jods-logo-trigger.mouseleave+0.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
                <animateMotion
                  path="M0,0 C-100,150 100,200 200,100 C300,0 100,50 0,0"
                  dur="5s"
                  begin="jods-logo-trigger.mouseenter+0.6s"
                  end="jods-logo-trigger.mouseleave+0.2s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />

                {/* Flash mob animations for squirrel */}
                <animate
                  attributeName="opacity"
                  values="0;1;1;1;0"
                  dur="8s"
                  begin="jods-logo-trigger.dblclick+1.8s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
                <animateMotion
                  path="M0,0 C-100,200 100,300 200,200 C300,100 100,50 0,0"
                  dur="8s"
                  begin="jods-logo-trigger.dblclick+1.8s"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="8s"
                  begin="jods-logo-trigger.dblclick+1.8s"
                  additive="sum"
                  repeatCount="1"
                  fill="freeze"
                  restart="always"
                />
              </g>
            </g>

            {/* Supernova effect - massive, subtle burst */}
            <g className="rainbowBursts">
              {/* Main supernova burst - extremely wide, ambient */}
              <circle
                cx="400"
                cy="250"
                r="0"
                fill="url(#supernovaGlow)"
                opacity="0"
                filter="url(#supernovaBlur)"
                className="rainbowBurst supernovaEffect"
              >
                <animate
                  attributeName="r"
                  values="0;300;800;1500;2200"
                  keyTimes="0;0.15;0.3;0.6;1"
                  calcMode="spline"
                  keySplines="0.17, 0.67, 0.83, 0.97;0.25, 0.46, 0.45, 0.94;0.36, 0.66, 0.04, 1;0.5, 0.2, 0.6, 1"
                  dur="5s"
                  begin="jods-logo-trigger.mouseenter"
                  end="jods-logo-trigger.mouseleave+0.1s"
                  repeatCount="1"
                  fill="freeze"
                  restart="whenNotActive"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.95;0.8;0.5;0.2;0"
                  keyTimes="0;0.1;0.25;0.5;0.75;1"
                  calcMode="spline"
                  keySplines="0.17, 0.67, 0.83, 0.97;0.25, 0.46, 0.45, 0.94;0.36, 0.66, 0.04, 1;0.5, 0.2, 0.6, 1;0.5, 0.2, 0.6, 1"
                  dur="5s"
                  begin="jods-logo-trigger.mouseenter"
                  end="jods-logo-trigger.mouseleave+0.1s"
                  repeatCount="1"
                  fill="freeze"
                  restart="whenNotActive"
                />
                {/* Add shrink back animation on mouse leave */}
                <animate
                  attributeName="r"
                  values="2200;1500;800;300;0"
                  keyTimes="0;0.3;0.6;0.8;1"
                  calcMode="spline"
                  keySplines="0.36, 0.66, 0.04, 1;0.5, 0.2, 0.6, 1;0.25, 0.46, 0.45, 0.94;0.17, 0.67, 0.83, 0.97"
                  dur="0.8s"
                  begin="jods-logo-trigger.mouseleave"
                  repeatCount="1"
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  values="0.2;0.3;0.2;0.1;0"
                  keyTimes="0;0.3;0.6;0.8;1"
                  calcMode="spline"
                  keySplines="0.36, 0.66, 0.04, 1;0.5, 0.2, 0.6, 1;0.25, 0.46, 0.45, 0.94;0.17, 0.67, 0.83, 0.97"
                  dur="0.8s"
                  begin="jods-logo-trigger.mouseleave"
                  repeatCount="1"
                  fill="freeze"
                />
                {/* Quick shrink animation on click for better cleanup */}
                <animate
                  attributeName="r"
                  values="2200;0"
                  dur="0.5s"
                  begin="jods-logo-trigger.click"
                  repeatCount="1"
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  values="0.2;0"
                  dur="0.5s"
                  begin="jods-logo-trigger.click"
                  repeatCount="1"
                  fill="freeze"
                />
              </circle>
            </g>

            {/* Flash Mob Party Animation */}
            <g className={styles.flashMobParty} opacity="0">
              {/* Add flash mob elements */}
            </g>
          </g>
        </svg>
      </div>

      <h1 className={styles.heroTitle}>
        <span
          id="jods-logo-trigger"
          className={styles.jodsLogo}
          ref={jodsLogoRef}
          title="Double-click for a surprise!"
        >
          <span className={styles.jodsLogoBraces}>{"{ "}</span> jods{" "}
          <span className={styles.jodsLogoBraces}>{" }"}</span>
        </span>
      </h1>

      <p className={styles.heroSubtitle}>
        <span className={styles.emoji}>✨</span>
        <Translate
          id="homepage.hero.subtitle"
          description="Subtitle of the homepage hero section"
        >
          JSON Dynamics System
        </Translate>
        <span className={styles.emoji}>🔄</span>
      </p>

      <p className={styles.heroDescription}>
        <span className={styles.gradientText}>
          <Translate
            id="homepage.hero.description"
            description="Description text of the homepage hero"
          >
            Reactive JSON with superpowers
          </Translate>
        </span>
      </p>

      <div className={styles.heroFeatures}>
        <span>
          <Translate
            id="homepage.hero.feature.minimal"
            description="Minimal feature badge in hero section"
          >
            🌱 Minimal
          </Translate>
        </span>
        <span className={styles.separator}>•</span>
        <span>
          <Translate
            id="homepage.hero.feature.typesafe"
            description="Typesafe feature badge in hero section"
          >
            🔍 Typesafe
          </Translate>
        </span>
        <span className={styles.separator}>•</span>
        <span>
          <Translate
            id="homepage.hero.feature.fast"
            description="Fast feature badge in hero section"
          >
            ⚡ Fast
          </Translate>
        </span>
      </div>

      <div className={styles.heroButtons}>
        <Link
          to="/examples"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          <Translate
            id="homepage.hero.button.getStarted"
            description="Get started button text in hero section"
          >
            Get Started
          </Translate>
        </Link>

        <Link to="/remix" className={`${styles.button} ${styles.buttonRemix}`}>
          <span className={styles.remixButtonIcon}>💿</span>{" "}
          <Translate
            id="homepage.hero.button.remix"
            description="Remix button text in hero section"
          >
            Remix
          </Translate>
        </Link>
      </div>
    </div>
  );
}
