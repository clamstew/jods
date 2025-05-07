import React, { useState, useEffect } from "react";
import CodeBlock from "@theme/CodeBlock";
import styles from "./FrameworkShowcase.module.css";
import useIsBrowser from "@docusaurus/useIsBrowser";

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

  const frameworks = {
    react: {
      title: "React",
      icon: "⚛️",
      color: "#61dafb",
      description: "Seamless integration with React's component lifecycle",
      code: `import { store } from 'jods';
import { useJods } from 'jods/react';

const counter = store({ count: 0 });

function Counter() {
  const state = useJods(counter);
  
  return (
    <button onClick={() => counter.count++}>
      Count: {state.count}
    </button>
  );
}`,
    },
    preact: {
      title: "Preact",
      icon: "⚡",
      color: "#673ab8",
      description: "Lightweight integration for Preact applications",
      code: `import { store } from 'jods';
import { useJods } from 'jods/preact';

const counter = store({ count: 0 });

function Counter() {
  const state = useJods(counter);
  
  return (
    <button onClick={() => counter.count++}>
      Count: {state.count}
    </button>
  );
}`,
    },
    remix: {
      title: "Remix",
      icon: "💿",
      color: "#e91e63",
      description: "Specialized integration for Remix applications",
      code: `import { defineStore, withJods, useJodsStore } from 'jods/remix';

export const counter = defineStore({
  name: 'counter',
  defaults: { count: 0 },
  handlers: {
    async increment({ current }) {
      current.count++;
      return current;
    }
  }
});

// Export ready-to-use loader
export const loader = withJods([counter]);
// Export the action
export const action = counter.action;

// In your component
function Counter() {
  const state = useJodsStore(counter);
  const form = useJodsForm(counter.actions.increment);
  
  return (
    <form {...form.props}>
      <button>Count: {state.count}</button>
    </form>
  );
}`,
    },
  };

  return (
    <section
      className={`features-container ${styles.frameworkSection}`}
      id="framework-showcase"
      style={{ background: "var(--ifm-background-surface-color)" }}
      data-testid="jods-framework-section"
    >
      <div className="container">
        <h2 className="section-title">
          🔌 Works with your{" "}
          <span className="gradient-text">favorite frameworks 🧩</span>
        </h2>
        <p
          style={{
            textAlign: "center",
            maxWidth: "700px",
            margin: "0 auto 2rem",
          }}
        >
          Seamlessly integrate jods with React, Preact, and Remix using
          dedicated adapters
        </p>

        <div className="framework-tabs-container">
          <div className={styles.frameworkTabs}>
            {Object.entries(frameworks).map(([key, framework]) => (
              <div
                key={key}
                className={`framework-card ${
                  activeFramework === key ? "active" : ""
                }`}
                onClick={() => setActiveFramework(key)}
                style={{
                  cursor: "pointer",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  background:
                    isBrowser && activeFramework === key
                      ? key === "react"
                        ? theme === "dark"
                          ? "linear-gradient(145deg, #f97316, #fb923c)"
                          : "linear-gradient(145deg, var(--jods-blue-dark), var(--jods-cyan))"
                        : key === "preact"
                        ? theme === "dark"
                          ? "linear-gradient(145deg, #8b5cf6, #6366f1)"
                          : "linear-gradient(145deg, #4a347f, #673ab8)"
                        : theme === "dark"
                        ? "linear-gradient(145deg, #f43f5e, #ec4899)"
                        : "linear-gradient(145deg, #b81d5b, #e91e63)"
                      : "var(--ifm-card-background-color)",
                  color:
                    activeFramework === key
                      ? "white"
                      : "var(--ifm-color-emphasis-900)",
                  boxShadow:
                    isBrowser && activeFramework === key
                      ? key === "react"
                        ? theme === "dark"
                          ? "0 8px 16px rgba(249, 115, 22, 0.25)"
                          : "0 8px 16px rgba(8, 145, 178, 0.25)"
                        : key === "preact"
                        ? theme === "dark"
                          ? "0 8px 16px rgba(99, 102, 241, 0.25)"
                          : "0 8px 16px rgba(103, 58, 184, 0.25)"
                        : theme === "dark"
                        ? "0 8px 16px rgba(236, 72, 153, 0.25)"
                        : "0 8px 16px rgba(233, 30, 99, 0.25)"
                      : "0 4px 8px rgba(0, 0, 0, 0.05)",
                  border:
                    activeFramework === key
                      ? "none"
                      : "1px solid var(--ifm-color-emphasis-200)",
                  flex: "1",
                  minWidth: "150px",
                  maxWidth: "220px",
                  transition: "all 0.3s ease",
                  transform:
                    activeFramework === key ? "translateY(-5px)" : "none",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    marginBottom: "0.75rem",
                    transition: "transform 0.3s ease",
                    display: "inline-block",
                  }}
                  className={key === "remix" ? styles.spinningEmoji : ""}
                >
                  {framework.icon}
                </div>
                <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>
                  {framework.title}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
                  {framework.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="code-container"
          style={{
            margin: "0 auto",
            position: "relative",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {isBrowser && (
            <div
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                zIndex: 2,
                fontSize: "0.8rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                background: frameworks[activeFramework].color,
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {frameworks[activeFramework].title}
            </div>
          )}
          <CodeBlock language="jsx" className="w-100">
            {frameworks[activeFramework].code}
          </CodeBlock>
        </div>
      </div>
    </section>
  );
}
