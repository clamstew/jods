/**
 * Utility functions for the HomepageHero component.
 */

// Theme colors used for animations
export const getThemeColors = (colorMode: "dark" | "light") => {
  const darkModeColors = [
    "rgba(110, 231, 183, 0.8)", // teal
    "rgba(129, 140, 248, 0.8)", // indigo
    "rgba(251, 146, 60, 0.8)", // orange
    "rgba(236, 72, 153, 0.8)", // pink
    "rgba(139, 92, 246, 0.8)", // purple
    "rgba(52, 211, 153, 0.8)", // emerald
  ];

  const lightModeColors = [
    "rgba(240, 249, 255, 0.9)", // almost white with blue tint
    "rgba(245, 243, 255, 0.9)", // almost white with lavender tint
    "rgba(255, 250, 230, 0.9)", // soft warm yellow/cream
    "rgba(254, 240, 138, 0.8)", // soft yellow
    "rgba(0, 58, 117, 0.7)", // deep navy blue
    "rgba(3, 105, 161, 0.7)", // dark blue
  ];

  return colorMode === "dark" ? darkModeColors : lightModeColors;
};

// JSON snippets for animation
export const jsonSnippets = [
  '{ "name": "jods" }',
  '{ "reactive": true }',
  '{ "dynamic": true }',
  '{ "size": "tiny" }',
  '{ "computed": () => {} }',
  '{ "frameworks": ["remix", "react", "preact"] }',
  '{ "🐿️": "🦆" }',
  '{ "agent": "Burt Macklin, FBI" }',
  '{ "threat_level": "Midnight" }',
  '{ "agent": "Michael Scarn" }',
  '{ "time_travel": true }',
  '{ "history": ["past", "present", "future"] }',
  '{ "state": "reactive", "mood": "happy" }',
  '{ "debug": { "level": "over 9000" } }',
  '{ "zod": "schema", "validation": "✅" }',
  '{ "socketConnect": true, "syncing": "bidirectional" }',
  '{ "persist": { "storage": "localStorage", "key": "cart", "version": "1.0.2" } }',
  '{ "sync": { "mode": "peer", "allowKeys": ["items", "note"] } }',
  '{ "stream": { "validate": true, "batch": true } }',
  '{ "hydrate": true, "persist": true, "stream": true }',
  '{ "timestamp": "2025-05-05T12:34:56Z", "patches": [{"op": "replace", "path": "/name", "value": "jods"}] }',
  '{ "schema": { "items": "z.array(z.object({}))", "filter": "all" } }',
];

// Themed emojis for the animation background
export const themeEmojis = [
  "⚛️", // atom/reactive
  "💿", // initial remix support
  "🔄", // refresh/update
  "✨", // sparkles/magic
  "🧩", // puzzle piece/composable
  "🔮", // crystal ball/computed values
  "🕰️", // time-travel
  "📦", // package/store
  "⚡", // lightning/speed
  "📷", // snapshot/json
  "💾", // disk/persistence
  "🏝️", // tanstack reference
  "🐻", // bear/zustand reference
];

// Helper to generate a random number between min and max
export const randomBetween = (min: number, max: number) => {
  return min + Math.random() * (max - min);
};

// Helper to create keyframes string for animations
export const createKeyframesString = (colorMode: "dark" | "light") => `
  /* Dreamscape text animations */
  @keyframes text-float {
    0% { transform: translate(0, 0) perspective(1000px) rotateX(0deg) rotateY(0deg); }
    25% { transform: translate(${randomBetween(-2.5, 2.5)}vw, ${randomBetween(
  -2.5,
  2.5
)}vh) perspective(1000px) rotateX(${randomBetween(
  -5,
  5
)}deg) rotateY(${randomBetween(-5, 5)}deg); }
    50% { transform: translate(${randomBetween(-2.5, 2.5)}vw, ${randomBetween(
  -2.5,
  2.5
)}vh) perspective(1000px) rotateX(${randomBetween(
  -5,
  5
)}deg) rotateY(${randomBetween(-5, 5)}deg); }
    75% { transform: translate(${randomBetween(-2.5, 2.5)}vw, ${randomBetween(
  -2.5,
  2.5
)}vh) perspective(1000px) rotateX(${randomBetween(
  -5,
  5
)}deg) rotateY(${randomBetween(-5, 5)}deg); }
    100% { transform: translate(0, 0) perspective(1000px) rotateX(0deg) rotateY(0deg); }
  }
  
  @keyframes text-fade {
    0% { opacity: 0.2; }
    50% { opacity: 0.4; }
    100% { opacity: 0.2; }
  }
  
  @keyframes text-rotate {
    0% { transform: rotate(-1deg); }
    100% { transform: rotate(1deg); }
  }
  
  /* Hero title glow effect */
  @keyframes title-glow {
    0% { text-shadow: 0 0 10px ${
      colorMode === "dark"
        ? "rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)"
        : "rgba(56, 189, 248, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)"
    }; }
    50% { text-shadow: 0 0 15px ${
      colorMode === "dark"
        ? "rgba(245, 158, 11, 0.6), 0 0 25px rgba(245, 158, 11, 0.3)"
        : "rgba(56, 189, 248, 0.6), 0 0 25px rgba(56, 189, 248, 0.3)"
    }; }
    100% { text-shadow: 0 0 10px ${
      colorMode === "dark"
        ? "rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)"
        : "rgba(56, 189, 248, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)"
    }; }
  }
`;
