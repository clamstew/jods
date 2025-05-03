import React, { useEffect, useRef } from "react";
import Link from "@docusaurus/Link";

export default function HomepageHero(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create animated JSON elements
    const container = containerRef.current;
    const jsonSnippets = [
      '{ "name": "jods" }',
      '{ "reactive": true }',
      '{ "json": "on-demand" }',
      '{ "size": "tiny" }',
      '{ "computed": () => {} }',
    ];

    // Create JSON floating elements
    const elements: HTMLDivElement[] = [];

    for (let i = 0; i < 8; i++) {
      const element = document.createElement("div");
      element.className = "json-animation";
      element.style.fontSize = `${Math.random() * 0.7 + 0.8}rem`;
      element.style.top = `${Math.random() * 100}%`;
      element.style.left = `${Math.random() * 100}%`;
      element.innerHTML =
        jsonSnippets[Math.floor(Math.random() * jsonSnippets.length)];

      // Different animation durations and delays
      element.style.animationDuration = `${Math.random() * 10 + 10}s`;
      element.style.animationDelay = `${Math.random() * 5}s`;

      container.appendChild(element);
      elements.push(element);
    }

    return () => {
      elements.forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, []);

  return (
    <div className="hero-container" ref={containerRef}>
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="gradient-text">jods</span>
        </h1>
        <p className="hero-subtitle">JSON On Demand Store</p>
        <p className="hero-description">
          A minimal, reactive state layer that brings simplicity back to state
          management
        </p>
        <div className="hero-buttons">
          <Link className="button button--primary button--lg" to="/intro">
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" to="/examples">
            See Examples
          </Link>
        </div>
      </div>
    </div>
  );
}
