import React, { useState, useEffect } from "react";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";
import styles from "./FeatureHighlights.module.css";
import FluxSvg from "./flux2.svg";
import DJRemixFinal from "./DJRemixFinal";
import useIsBrowser from "@docusaurus/useIsBrowser";

interface FeatureProps {
  icon: string | React.ReactNode;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  link: string;
  isNew?: boolean;
  isWide?: boolean;
  bullets?: Array<string | React.ReactNode>;
  smoothScroll?: boolean;
  customClass?: string;
  iconHover?: string | React.ReactNode;
}

// Feature category definitions
const CATEGORIES = {
  CORE: (
    <Translate
      id="homepage.features.category.core"
      description="Core features category title"
    >
      Core Features
    </Translate>
  ),
  FRAMEWORKS: (
    <Translate
      id="homepage.features.category.frameworks"
      description="Framework integration category title"
    >
      Framework Integration
    </Translate>
  ),
  DEV_EXPERIENCE: (
    <Translate
      id="homepage.features.category.dev_experience"
      description="Developer experience category title"
    >
      Developer Experience
    </Translate>
  ),
};

function Feature({
  icon,
  title,
  description,
  link,
  isNew = false,
  isWide = false,
  bullets = [],
  smoothScroll = false,
  customClass,
  iconHover,
}: FeatureProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  // Add smooth scroll handler for specific features
  const handleSmoothScroll = (e: React.MouseEvent) => {
    // Only apply smooth scroll if the prop is set
    if (smoothScroll && link.startsWith("#")) {
      e.preventDefault();
      const targetElement = document.getElementById(link.substring(1));
      if (targetElement) {
        // Get the header element or use a fixed offset if you can't find it
        const headerElement = document.querySelector(".navbar") as HTMLElement;
        const headerHeight = headerElement ? headerElement.offsetHeight : 60;

        // Calculate position accounting for header height
        const targetPosition =
          targetElement.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight;

        // Scroll with offset
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <Link
      to={link}
      className={`${styles.featureCard} ${
        isWide ? styles.featureCardWide : ""
      } ${customClass || ""}`}
      onClick={handleSmoothScroll}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.featureHeader}>
        <div
          className={`${styles.featureIcon} ${
            isNew ? styles.featureIconAnimated : ""
          }`}
        >
          {isHovered && iconHover ? iconHover : icon}
        </div>
        <div className={styles.titleWrapper}>
          <h3>{title}</h3>
          {isNew && (
            <span className={styles.newBadge}>
              <Translate
                id="homepage.features.badge.new"
                description="New badge on feature cards"
              >
                NEW
              </Translate>
            </span>
          )}
        </div>
      </div>
      <p className={styles.featureDescription}>{description}</p>

      {bullets.length > 0 && (
        <ul className={styles.featureBullets}>
          {bullets.map((bullet, index) => {
            if (typeof bullet === "string") {
              // Check for <pre> or <code> tags
              const preMatch = bullet.match(/<pre>(.*?)<\/pre>/);
              const codeMatch = bullet.match(/<code>(.*?)<\/code>/);

              if (preMatch || codeMatch) {
                const match = preMatch || codeMatch;
                const codePart = match[1];
                const parts = bullet.split(match[0]);

                return (
                  <li key={index}>
                    {parts[0]}
                    <code className="inline-code">{codePart}</code>
                    {parts[1]}
                  </li>
                );
              }
            }

            return <li key={index}>{bullet}</li>;
          })}
        </ul>
      )}
    </Link>
  );
}

function CategoryHeader({
  title,
}: {
  title: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={styles.categoryHeader}>
      <h3 className={styles.categoryTitle}>{title}</h3>
      <div className={styles.categoryDivider}></div>
    </div>
  );
}

export default function FeatureHighlights(): React.ReactElement {
  const isBrowser = useIsBrowser();
  const [theme, setTheme] = useState("light");

  // Listen for theme changes on client-side only
  useEffect(() => {
    if (isBrowser) {
      // Initialize theme
      setTheme(document.documentElement.getAttribute("data-theme") || "light");

      // Observer for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "data-theme"
          ) {
            setTheme(
              document.documentElement.getAttribute("data-theme") || "light"
            );
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      return () => observer.disconnect();
    }
  }, [isBrowser]);

  return (
    <section
      className={styles.featuresContainer}
      id="features"
      data-testid="jods-features-section"
    >
      <div className="container">
        <h2 className={styles.sectionTitle}>
          <span className={styles.vibeGlowPlug}>⚡️</span>{" "}
          <Translate id="homepage.features.title.prefix">
            {"Powerful features, "}
          </Translate>
          <span className="gradient-text">
            <Translate id="homepage.features.title.gradient">
              {"minimal API 🪶"}
            </Translate>
          </span>
        </h2>

        {/* Core Features Section */}
        <CategoryHeader title={CATEGORIES.CORE} />
        <div className={styles.featuresGrid}>
          <Feature
            icon="☁️"
            title={
              <Translate
                id="homepage.features.zero_dependencies.title"
                description="Zero dependencies feature title"
              >
                Zero Dependencies
              </Translate>
            }
            description={
              <Translate
                id="homepage.features.zero_dependencies.description"
                description="Zero dependencies feature description"
              >
                No bloat, no overhead, just pure performance with a tiny
                footprint that won't slow down your application.
              </Translate>
            }
            link="/intro"
          />
          <Feature
            icon="🧠"
            title={
              <Translate
                id="homepage.features.computed_values.title"
                description="Computed values feature title"
              >
                Computed Values
              </Translate>
            }
            description={
              <Translate
                id="homepage.features.computed_values.description"
                description="Computed values feature description"
              >
                Create reactive derived state that updates automatically when
                dependencies change, with full TypeScript support.
              </Translate>
            }
            link="/api-reference#-computedfn"
          />
          <Feature
            icon={<FluxSvg className={styles.fluxIcon} />}
            title={
              <Translate
                id="homepage.features.reactivity.title"
                description="Reactivity feature title"
              >
                Fine-grained Reactivity
              </Translate>
            }
            description={
              <Translate
                id="homepage.features.reactivity.description"
                description="Reactivity feature description"
              >
                Signal-based tracking for optimal performance, updating only
                what changed, with automatic dependency tracking.
              </Translate>
            }
            link="/dynamics-system"
          />
        </div>

        {/* Framework Integration Section */}
        <CategoryHeader title={CATEGORIES.FRAMEWORKS} />
        <div className={`${styles.frameworkGrid}`}>
          <Feature
            icon={
              <div className={styles.frameworkIconContainer}>
                <span
                  className={`${styles.mainFrameworkIcon} ${styles.reactIcon}`}
                >
                  ⚛️
                </span>
                <span
                  className={`${styles.mainFrameworkIcon} ${styles.preactIcon}`}
                >
                  ⚡
                </span>
                <span
                  className={`${styles.mainFrameworkIcon} ${styles.otherIcon}`}
                >
                  💿
                </span>
                <span className={styles.frameworkGlow}></span>
              </div>
            }
            title={
              <Translate
                id="homepage.features.framework_integration.title"
                description="Framework integration feature title"
              >
                Frameworks!
              </Translate>
            }
            description={
              <>
                <Translate
                  id="homepage.features.framework_integration.description"
                  description="Framework integration feature description"
                >
                  First-class support for React and Preact with dedicated hooks
                  that make state management simple and intuitive.
                </Translate>
                <div className={styles.frameworkCodeExample}>
                  <code>useJods()</code>
                </div>
                <p className={styles.frameworkTagline}>
                  One hook to rule them all - works seamlessly with
                  <br />
                  React, Preact, and Remix in client or full-stack apps.
                </p>
                <div className={styles.frameworkIntegrations}>
                  <span className={styles.integrationIcon}>⚛️</span>
                  <span className={styles.integrationIcon}>⚡</span>
                  <span className={styles.integrationIcon}>💿</span>
                </div>
              </>
            }
            link="#framework-showcase"
            isWide={false}
            smoothScroll={true}
            customClass={styles.frameworkCard}
          />
          <div
            className={`${styles.featureCard} ${styles.remixFeatureCard}`}
            onClick={(e) => {
              e.preventDefault();
              const targetElement =
                document.getElementById("remix-integration");
              if (targetElement) {
                const headerElement = document.querySelector(
                  ".navbar"
                ) as HTMLElement;
                const headerHeight = headerElement
                  ? headerElement.offsetHeight
                  : 60;
                const targetPosition =
                  targetElement.getBoundingClientRect().top +
                  window.pageYOffset -
                  headerHeight;
                window.scrollTo({
                  top: targetPosition,
                  behavior: "smooth",
                });
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <DJRemixFinal theme={theme === "dark" ? "dark" : "light"} />
          </div>
        </div>

        {/* Developer Experience Section */}
        <CategoryHeader title={CATEGORIES.DEV_EXPERIENCE} />
        <div className={styles.featuresGrid}>
          <Feature
            icon="🧬"
            title={
              <Translate
                id="homepage.features.mental_model.title"
                description="Mental model feature title"
              >
                Simple Mental Model
              </Translate>
            }
            description={
              <Translate
                id="homepage.features.mental_model.description"
                description="Mental model feature description"
              >
                Just use objects directly - no actions, reducers, or boilerplate
                to manage your state. Mutate and subscribe with ease.
              </Translate>
            }
            link="/intro"
          />
          <Feature
            icon="📷"
            iconHover="📸"
            title={
              <Translate
                id="homepage.features.json_snapshots.title"
                description="JSON snapshots feature title"
              >
                JSON Snapshots
              </Translate>
            }
            description={
              <Translate
                id="homepage.features.json_snapshots.description"
                description="JSON snapshots feature description"
              >
                Get serializable state snapshots on demand with json() - perfect
                for APIs, persistence, and time-travel debugging.
              </Translate>
            }
            link="/api-reference#-jsonstore"
          />
          <Feature
            icon="🔍"
            title={
              <Translate
                id="homepage.features.debugging.title"
                description="Debugging feature title"
              >
                Transparent Debugging
              </Translate>
            }
            description={
              <Translate
                id="homepage.features.debugging.description"
                description="Debugging feature description"
              >
                Inspect your state at any time, with built-in history tracking
                and time-travel debugging capabilities.
              </Translate>
            }
            link="/jods/time-travel-debugging"
          />
        </div>
      </div>
    </section>
  );
}
