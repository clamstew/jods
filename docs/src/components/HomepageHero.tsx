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
      '{ "dynamic": true }',
      '{ "size": "tiny" }',
      '{ "computed": () => {} }',
      '{ "frameworks"?: ["remix", "react", "preact", "vanilla"] }',
      '{ "🐿️": "🦆" }',
      '{ "agent": "Burt Macklin, FBI" }',
      '{ "threat_level": "Midnight" }',
      '{ "agent": "Michael Scarn" }',
      '{ "time_travel": true }',
      '{ "history": ["past", "present", "future"] }',
      '{ "state": "reactive", "mood": "happy" }',
      '{ "debug": { "enabled": true, "level": "over 9000" } }',
      '{ "zod": "schema", "validation": "✅" }',
    ];

    // Create JSON floating elements
    const elements: HTMLDivElement[] = [];

    // Number of elements to create (increased to show more variety)
    const numElements = 12;

    // Create a virtual grid for more evenly distributed elements
    const gridRows = 4;
    const gridCols = 4;

    // Used snippets tracker to avoid duplicates in nearby cells
    const usedIndices = new Set<number>();

    for (let i = 0; i < numElements; i++) {
      const element = document.createElement("div");
      element.className = "json-animation";

      // Calculate grid position
      const row = Math.floor(i / gridCols);
      const col = i % gridCols;

      // Add some randomness within the cell
      const cellWidth = 100 / gridCols;
      const cellHeight = 100 / gridRows;

      // Position within the cell (with 10% padding from edges)
      const xPos =
        cellWidth * col + cellWidth * 0.1 + Math.random() * cellWidth * 0.8;
      const yPos =
        cellHeight * row + cellHeight * 0.1 + Math.random() * cellHeight * 0.8;

      element.style.fontSize = `${Math.random() * 0.5 + 0.8}rem`;
      element.style.top = `${yPos}%`;
      element.style.left = `${xPos}%`;

      // Select a snippet that hasn't been used recently
      let snippetIndex;
      do {
        snippetIndex = Math.floor(Math.random() * jsonSnippets.length);
      } while (
        usedIndices.has(snippetIndex) &&
        usedIndices.size < jsonSnippets.length / 2
      );

      usedIndices.add(snippetIndex);
      // Keep the set limited to recent snippets
      if (usedIndices.size > 5) {
        usedIndices.delete([...usedIndices][0]);
      }

      element.innerHTML = jsonSnippets[snippetIndex];

      // Varied animation parameters for more natural movement
      element.style.animationDuration = `${Math.random() * 15 + 20}s`;
      element.style.animationDelay = `${Math.random() * 8}s`;

      // Add subtle rotation to some elements
      if (Math.random() > 0.5) {
        const rotation = Math.random() * 8 - 4; // -4 to 4 degrees
        element.style.transform = `rotate(${rotation}deg)`;
      }

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
          <span className="gradient-text">💫 jods {}</span>
        </h1>
        <p className="hero-subtitle">
          <span className="gradient-text">✨</span> JavaScript Object Dynamics
          System 🔄
        </p>
        <p className="hero-description">
          A fun, intuitive reactive state library that makes JavaScript objects
          come alive
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
