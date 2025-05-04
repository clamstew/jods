import React from "react";
import Link from "@docusaurus/Link";
import styles from "./FeatureHighlights.module.css";

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
  link: string;
}

function Feature({
  icon,
  title,
  description,
  link,
}: FeatureProps): React.ReactElement {
  return (
    <Link to={link} className={styles.featureCard}>
      <div className={styles.featureHeader}>
        <div className={styles.featureIcon}>{icon}</div>
        <h3>{title}</h3>
      </div>
      <p className={styles.featureDescription}>{description}</p>
    </Link>
  );
}

export default function FeatureHighlights(): React.ReactElement {
  return (
    <section className={styles.featuresContainer} id="features">
      <div className="container">
        <h2 className={styles.sectionTitle}>
          ⚡️Powerful features,{" "}
          <span className="gradient-text">minimal API 🪶</span>
        </h2>

        <div className={styles.featuresGrid}>
          <Feature
            icon="☁️"
            title="Zero Dependencies"
            description="No bloat, no overhead, just pure performance with a tiny footprint."
            link="/intro"
          />
          <Feature
            icon="🧠"
            title="Computed Values"
            description="Create reactive derived state that updates automatically when dependencies change."
            link="/api-reference#-computedfn"
          />
          <Feature
            icon="⚡"
            title="Framework Integration"
            description="First-class support for React, Preact, and Remix with dedicated hooks and adapters."
            link="/remix"
          />
          <Feature
            icon="🪞"
            title="JSON Snapshots"
            description="Get serializable state snapshots on demand with json() - perfect for APIs and persistence."
            link="/api-reference#-jsonstore"
          />
          <Feature
            icon="🧬"
            title="Simple Mental Model"
            description="Just use objects directly - no actions, reducers, or boilerplate to manage your state."
            link="/intro"
          />
          <Feature
            icon="🔄"
            title="Fine-grained Reactivity"
            description="Signal-based tracking for optimal performance, updating only what changed."
            link="/dynamics-system"
          />
        </div>
      </div>
    </section>
  );
}
