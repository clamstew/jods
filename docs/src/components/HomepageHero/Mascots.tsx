import React from "react";

interface MascotsProps {
  mascotsInteracting: boolean;
  setMascotsInteracting: (value: boolean) => void;
  handleMascotHover: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Mascots({
  mascotsInteracting,
  setMascotsInteracting,
  handleMascotHover,
}: MascotsProps): React.ReactElement {
  return (
    <div className={`hero__mascots ${mascotsInteracting ? "interacting" : ""}`}>
      <div
        className="hero__mascot hero__mascot--squirrel"
        onClick={() => setMascotsInteracting(!mascotsInteracting)}
        onMouseEnter={handleMascotHover}
        title="Click to make friends with the duck!"
      >
        🐿️
        <div
          className="speech-bubble"
          data-message={
            mascotsInteracting
              ? "We make a great team! 🤝"
              : "I love storing reactive state! 🌰"
          }
        />
      </div>
      <div
        className="hero__mascot hero__mascot--duck"
        onClick={() => setMascotsInteracting(!mascotsInteracting)}
        onMouseEnter={handleMascotHover}
        title="Click to make friends with the squirrel!"
      >
        🦆
        <div
          className="speech-bubble"
          data-message={
            mascotsInteracting ? "Dynamic duo! 💪" : "Quack! JSON on demand! 📦"
          }
        />
      </div>

      {/* Add sparkle when interacting */}
      {mascotsInteracting && (
        <div className="hero__mascots-sparkle" aria-hidden="true">
          ✨
        </div>
      )}
    </div>
  );
}
