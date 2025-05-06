import React from "react";
import Link from "@docusaurus/Link";
import styles from "./FeatureHighlights.module.css";

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
  link: string;
  isNew?: boolean;
  isWide?: boolean;
  bullets?: string[];
}

// Feature category definitions
const CATEGORIES = {
  CORE: "Core Features",
  FRAMEWORKS: "Framework Integration",
  DEV_EXPERIENCE: "Developer Experience",
};

function Feature({
  icon,
  title,
  description,
  link,
  isNew = false,
  isWide = false,
  bullets = [],
}: FeatureProps): React.ReactElement {
  return (
    <Link
      to={link}
      className={`${styles.featureCard} ${
        isWide ? styles.featureCardWide : ""
      }`}
    >
      <div className={styles.featureHeader}>
        <div
          className={`${styles.featureIcon} ${
            isNew ? styles.featureIconAnimated : ""
          }`}
        >
          {icon}
        </div>
        <div className={styles.titleWrapper}>
          <h3>{title}</h3>
          {isNew && <span className={styles.newBadge}>NEW</span>}
        </div>
      </div>
      <p className={styles.featureDescription}>{description}</p>

      {bullets.length > 0 && (
        <ul className={styles.featureBullets}>
          {bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      )}
    </Link>
  );
}

function CategoryHeader({ title }: { title: string }): React.ReactElement {
  return (
    <div className={styles.categoryHeader}>
      <h3 className={styles.categoryTitle}>{title}</h3>
      <div className={styles.categoryDivider}></div>
    </div>
  );
}

export default function FeatureHighlights(): React.ReactElement {
  return (
    <section
      className={styles.featuresContainer}
      id="features"
      data-testid="jods-features-section"
    >
      <div className="container">
        <h2 className={styles.sectionTitle}>
          ⚡️Powerful features,{" "}
          <span className="gradient-text">minimal API 🪶</span>
        </h2>

        {/* Core Features Section */}
        <CategoryHeader title={CATEGORIES.CORE} />
        <div className={styles.featuresGrid}>
          <Feature
            icon="☁️"
            title="Zero Dependencies"
            description="No bloat, no overhead, just pure performance with a tiny footprint that won't slow down your application."
            link="/intro"
          />
          <Feature
            icon="🧠"
            title="Computed Values"
            description="Create reactive derived state that updates automatically when dependencies change, with full TypeScript support."
            link="/api-reference#-computedfn"
          />
          <Feature
            icon="🪞"
            title="JSON Snapshots"
            description="Get serializable state snapshots on demand with json() - perfect for APIs, persistence, and time-travel debugging."
            link="/api-reference#-jsonstore"
          />
        </div>

        {/* Framework Integration Section */}
        <CategoryHeader title={CATEGORIES.FRAMEWORKS} />
        <div className={styles.featuresGrid}>
          <Feature
            icon="⚡"
            title="Framework Integration"
            description="First-class support for React and Preact with dedicated hooks that make state management simple and intuitive."
            link="/frameworks"
          />
          <Feature
            icon="💿"
            title="Remix Integration"
            description="Full-stack state management for Remix applications with server-side features, automatic hydration, and form handling."
            link="/remix"
            isNew={true}
            isWide={true}
            bullets={[
              "defineStore() for declarative server-aware stores",
              "useJodsForm() for implicit action dispatching",
              "withJods() for automatic SSR hydration",
              "rehydrateClient() for seamless client-side restoration",
            ]}
          />
        </div>

        {/* Developer Experience Section */}
        <CategoryHeader title={CATEGORIES.DEV_EXPERIENCE} />
        <div className={styles.featuresGrid}>
          <Feature
            icon="🧬"
            title="Simple Mental Model"
            description="Just use objects directly - no actions, reducers, or boilerplate to manage your state. Mutate and subscribe with ease."
            link="/intro"
          />
          <Feature
            icon="🔄"
            title="Fine-grained Reactivity"
            description="Signal-based tracking for optimal performance, updating only what changed, with automatic dependency tracking."
            link="/dynamics-system"
          />
        </div>
      </div>
    </section>
  );
}
