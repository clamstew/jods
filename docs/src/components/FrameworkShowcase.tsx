import React, { useState, useEffect } from "react";
import CodeBlock from "@theme/CodeBlock";
import Translate from "@docusaurus/Translate";
import styles from "./FrameworkShowcase.module.css";
import featureStyles from "./FeatureHighlights.module.css";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { translate } from "@docusaurus/Translate";
import {
  preactCodeSample,
  reactCodeSample,
  remixCodeSample,
} from "./FrameworkShowcaseCodeSamples";

export default function FrameworkShowcase(): React.ReactElement {
  const [activeFramework, setActiveFramework] = useState("react");
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

  // Get translations for code examples
  const counterReact = translate({
    id: "homepage.frameworks.react.code.counter",
    message: "counter",
    description: "French translation for counter in React example",
  });

  const countReact = translate({
    id: "homepage.frameworks.react.code.count",
    message: "Count",
    description: "French translation for Count in React example",
  });

  const counterPreact = translate({
    id: "homepage.frameworks.preact.code.counter",
    message: "counter",
    description: "French translation for counter in Preact example",
  });

  const countPreact = translate({
    id: "homepage.frameworks.preact.code.count",
    message: "Count",
    description: "French translation for Count in Preact example",
  });

  // Get translation for property name
  const countProperty = translate({
    id: "homepage.frameworks.code.property.count",
    message: "count",
    description: "Translation for the count property name in the store object",
  });

  const frameworks = {
    react: {
      title: (
        <Translate
          id="homepage.frameworks.react.title"
          description="React framework title"
        >
          React
        </Translate>
      ),
      icon: "⚛️",
      color: "#61dafb",
      description: (
        <Translate
          id="homepage.frameworks.react.description"
          description="React framework description"
        >
          Seamless integration with React's component lifecycle
        </Translate>
      ),
      code: reactCodeSample(counterReact, countProperty, countReact),
    },
    preact: {
      title: (
        <Translate
          id="homepage.frameworks.preact.title"
          description="Preact framework title"
        >
          Preact
        </Translate>
      ),
      icon: "⚡",
      color: "#673ab8",
      description: (
        <Translate
          id="homepage.frameworks.preact.description"
          description="Preact framework description"
        >
          Lightweight integration for Preact applications
        </Translate>
      ),
      code: preactCodeSample(counterPreact, countProperty, countPreact),
    },
    remix: {
      title: (
        <Translate
          id="homepage.frameworks.remix.title"
          description="Remix framework title"
        >
          Remix
        </Translate>
      ),
      icon: "💿",
      color: "#e91e63",
      description: (
        <Translate
          id="homepage.frameworks.remix.description"
          description="Remix framework description"
        >
          Specialized integration for Remix applications
        </Translate>
      ),
      code: remixCodeSample(counterPreact, countProperty),
    },
  };

  return (
    <>
      <section
        className={`${featureStyles.featuresContainer} ${styles.frameworkSection}`}
        id="framework-showcase"
        data-testid="jods-framework-section"
      >
        <div className="container">
          <h2 className="section-title">
            <span className={styles.vibeGlowPlug}>🔌</span>{" "}
            <Translate id="homepage.frameworks.title.prefix">
              {"Works with your "}
            </Translate>
            <span className="gradient-text">
              <Translate id="homepage.frameworks.title.gradient">
                {"favorite frameworks 🧩"}
              </Translate>
            </span>
          </h2>
          <p
            style={{
              textAlign: "center",
              maxWidth: "700px",
              margin: "0 auto 2rem",
            }}
          >
            <Translate
              id="homepage.frameworks.description"
              description="Framework showcase section description"
            >
              Seamlessly integrate jods with React, Preact, and Remix using
              dedicated adapters
            </Translate>
          </p>

          <div className={styles.frameworkTabsContainer}>
            <div className={styles.frameworkTabs}>
              {Object.entries(frameworks).map(([key, framework]) => {
                const isActive = activeFramework === key;
                const cardClasses = [
                  styles.frameworkCard,
                  isActive
                    ? styles.frameworkCardActive
                    : styles.frameworkCardInactive,
                ];

                if (isBrowser && isActive) {
                  if (key === "react") {
                    cardClasses.push(
                      theme === "dark"
                        ? styles.reactActiveCardDark
                        : styles.reactActiveCardLight
                    );
                  } else if (key === "preact") {
                    cardClasses.push(
                      theme === "dark"
                        ? styles.preactActiveCardDark
                        : styles.preactActiveCardLight
                    );
                  } else if (key === "remix") {
                    cardClasses.push(
                      theme === "dark"
                        ? styles.remixActiveCardDark
                        : styles.remixActiveCardLight
                    );
                  }
                }

                return (
                  <div
                    key={key}
                    className={`framework-card ${cardClasses.join(" ")} ${
                      isActive ? "active" : ""
                    }`}
                    onClick={() => setActiveFramework(key)}
                  >
                    <div
                      className={`${styles.frameworkIcon} ${
                        key === "remix" ? styles.spinningEmoji : ""
                      }`}
                    >
                      {framework.icon}
                    </div>
                    <h3 className={styles.frameworkTitle}>{framework.title}</h3>
                    <p className={styles.frameworkDescription}>
                      {framework.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.codeContainerWrapper}>
            <div className={styles.codeContainer}>
              {isBrowser && (
                <div
                  className={`${styles.frameworkBadge} ${
                    activeFramework === "react"
                      ? styles.reactBadge
                      : activeFramework === "preact"
                      ? styles.preactBadge
                      : styles.remixBadge
                  }`}
                >
                  {frameworks[activeFramework].title}
                </div>
              )}
              <CodeBlock language="jsx" className="w-100">
                {frameworks[activeFramework].code}
              </CodeBlock>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
