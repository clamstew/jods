import React, { useState } from "react";
import CodeBlock from "@theme/CodeBlock";

export default function FrameworkShowcase(): React.ReactElement {
  const [activeFramework, setActiveFramework] = useState("react");

  const frameworks = {
    react: {
      title: "⚛️ React",
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
      title: "⚡ Preact",
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
      title: "💿 Remix",
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
      className="features-container"
      style={{ background: "var(--ifm-background-surface-color)" }}
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

        <div
          className="tabs"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {Object.entries(frameworks).map(([key, value]) => (
            <button
              key={key}
              className={`tab ${activeFramework === key ? "active" : ""}`}
              onClick={() => setActiveFramework(key)}
            >
              {value.title}
            </button>
          ))}
        </div>

        <div
          className="code-container"
          style={{ maxWidth: "680px", margin: "0 auto" }}
        >
          <CodeBlock language="jsx">
            {frameworks[activeFramework].code}
          </CodeBlock>
        </div>
      </div>
    </section>
  );
}
