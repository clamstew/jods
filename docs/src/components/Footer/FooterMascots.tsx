import React, { useState } from "react";

export function FooterMascots(): React.ReactElement {
  const [interacting, setInteracting] = useState(false);

  const handleInteraction = () => {
    setInteracting((prev) => !prev);
  };

  return (
    <div className={`footer__mascots ${interacting ? "interacting" : ""}`}>
      <span
        onClick={handleInteraction}
        title="Click to make friends with the duck!"
      >
        🐿️
      </span>
      <span
        onClick={handleInteraction}
        title="Click to make friends with the squirrel!"
      >
        🦆
      </span>

      {/* Show sparkle emoji when interacting */}
      {interacting && (
        <span className="footer__mascots-sparkle" aria-hidden="true">
          ✨
        </span>
      )}
    </div>
  );
}
