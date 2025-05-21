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
export const getJsonSnippets = (
  translate: (id: string, message: string, description: string) => string
) => [
  translate(
    "homepage.hero.background.json1",
    '{ "name": "jods" }',
    "JSON snippet in hero background (name)"
  ),
  translate(
    "homepage.hero.background.json2",
    '{ "reactive": true }',
    "JSON snippet in hero background (reactive)"
  ),
  translate(
    "homepage.hero.background.json3",
    '{ "dynamic": true }',
    "JSON snippet in hero background (dynamic)"
  ),
  translate(
    "homepage.hero.background.json4",
    '{ "size": "tiny" }',
    "JSON snippet in hero background (size)"
  ),
  translate(
    "homepage.hero.background.json5",
    '{ "computed": () => {} }',
    "JSON snippet in hero background (computed)"
  ),
  translate(
    "homepage.hero.background.json6",
    '{ "frameworks": ["remix", "react", "preact"] }',
    "JSON snippet in hero background (frameworks)"
  ),
  translate(
    "homepage.hero.background.json7",
    '{ "🐿️": "🦆" }',
    "JSON snippet in hero background (mascots)"
  ),
  translate(
    "homepage.hero.background.json8",
    '{ "agent": "Burt Macklin, FBI" }',
    "JSON snippet in hero background (agent)"
  ),
  translate(
    "homepage.hero.background.json9",
    '{ "threat_level": "Midnight" }',
    "JSON snippet in hero background (threat level)"
  ),
  translate(
    "homepage.hero.background.json10",
    '{ "agent": "Michael Scarn" }',
    "JSON snippet in hero background (agent 2)"
  ),
  translate(
    "homepage.hero.background.json11",
    '{ "time_travel": true }',
    "JSON snippet in hero background (time travel)"
  ),
  translate(
    "homepage.hero.background.json12",
    '{ "history": ["past", "present", "future"] }',
    "JSON snippet in hero background (history)"
  ),
  translate(
    "homepage.hero.background.json13",
    '{ "state": "reactive", "mood": "happy" }',
    "JSON snippet in hero background (state and mood)"
  ),
  translate(
    "homepage.hero.background.json14",
    '{ "debug": { "level": "over 9000" } }',
    "JSON snippet in hero background (debug)"
  ),
  translate(
    "homepage.hero.background.json15",
    '{ "zod": "schema", "validation": "✅" }',
    "JSON snippet in hero background (zod)"
  ),
  translate(
    "homepage.hero.background.json16",
    '{ "socketConnect": true, "syncing": "bidirectional" }',
    "JSON snippet in hero background (socket connect)"
  ),
  translate(
    "homepage.hero.background.json17",
    '{ "persist": { "storage": "localStorage", "key": "cart", "version": "1.0.2" } }',
    "JSON snippet in hero background (persist)"
  ),
  translate(
    "homepage.hero.background.json18",
    '{ "sync": { "mode": "peer", "allowKeys": ["items", "note"] } }',
    "JSON snippet in hero background (sync)"
  ),
  translate(
    "homepage.hero.background.json19",
    '{ "stream": { "validate": true, "batch": true } }',
    "JSON snippet in hero background (stream)"
  ),
  translate(
    "homepage.hero.background.json20",
    '{ "hydrate": true, "persist": true, "stream": true }',
    "JSON snippet in hero background (hydrate)"
  ),
  translate(
    "homepage.hero.background.json21",
    '{ "timestamp": "2025-05-05T12:34:56Z", "patches": [{"op": "replace", "path": "/name", "value": "jods"}] }',
    "JSON snippet in hero background (timestamp)"
  ),
  translate(
    "homepage.hero.background.json22",
    '{ "schema": { "items": "z.array(z.object({}))", "filter": "all" } }',
    "JSON snippet in hero background (schema)"
  ),
];

// For backward compatibility, keep the old jsonSnippets array
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

// Original static emojis array (restored)
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

// New function to conditionally return disco ball emojis during flash mob/hover
export const getThemeEmojis = (isFlashMob = false) => {
  if (!isFlashMob) {
    return themeEmojis;
  }

  // During flash mob, replace some emojis with disco balls 🪩
  return [
    "⚛️", // atom/reactive
    "💿", // initial remix support
    "🪩", // disco ball (replaced 🔄 refresh/update)
    "✨", // sparkles/magic
    "🪩", // disco ball (replaced 🧩 puzzle piece/composable)
    "🔮", // crystal ball/computed values
    "🕰️", // time-travel
    "🪩", // disco ball (replaced 📦 package/store)
    "⚡", // lightning/speed
    "📷", // snapshot/json
    "💾", // disk/persistence
    "🏝️", // tanstack reference
    "🐻", // bear/zustand reference
  ];
};

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
