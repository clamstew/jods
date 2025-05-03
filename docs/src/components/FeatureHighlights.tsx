import React from "react";

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
}

function Feature({
  icon,
  title,
  description,
}: FeatureProps): React.ReactElement {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function FeatureHighlights(): React.ReactElement {
  return (
    <section className="features-container">
      <div className="container">
        <h2 className="section-title">
          ⚡️Powerful features,{" "}
          <span className="gradient-text">minimal API 🪶</span>
        </h2>

        <div className="features-grid">
          <Feature
            icon="☁️"
            title="Zero Dependencies"
            description="No bloat, no overhead, just pure performance with a tiny footprint."
          />
          <Feature
            icon="🧠"
            title="Computed Values"
            description="Create reactive derived state that updates automatically when dependencies change."
          />
          <Feature
            icon="⚡"
            title="Framework Integration"
            description="First-class support for React, Preact, and Remix with dedicated hooks and adapters."
          />
          <Feature
            icon="🪞"
            title="JSON Snapshots"
            description="Get serializable state snapshots on demand with json() - perfect for APIs and persistence."
          />
          <Feature
            icon="🧬"
            title="Simple Mental Model"
            description="Just use objects directly - no actions, reducers, or boilerplate to manage your state."
          />
          <Feature
            icon="🧩"
            title="Fine-grained Reactivity"
            description="Signal-based tracking for optimal performance, updating only what changed."
          />
        </div>
      </div>
    </section>
  );
}
