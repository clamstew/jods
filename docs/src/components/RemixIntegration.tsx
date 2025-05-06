import React, { useState } from "react";
import styles from "./RemixIntegration.module.css";
import CodeBlock from "@theme/CodeBlock";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onFeatureClick: () => void;
  isActive: boolean;
}

// Define highlight ranges for each feature in each tab
const highlightRanges = {
  traditional: {
    sync: [3, 7], // loader section in traditional code
    reactivity: [10, 19], // action section in traditional code
    zod: [0, 0], // no validation in traditional
    backend: [5, 5], // db.getTodos() line
    model: [0, 0], // no model pattern in traditional
  },
  model: {
    sync: [15, 18], // loader section
    reactivity: [20, 29], // handlers section for reactive updates
    zod: [4, 12], // zod schema definition
    backend: [16, 16], // db.getTodos() line
    model: [1, 30], // the entire model definition
  },
  component: {
    sync: [5, 8], // useJodsStore hook
    reactivity: [11, 11], // form handling for optimistic updates
    zod: [0, 0], // no zod schema here (it's in the model)
    backend: [0, 0], // no backend calls here (it's in the model)
    model: [3, 5], // import and using model
  },
};

function Feature({
  icon,
  title,
  description,
  onFeatureClick,
  isActive,
}: FeatureProps) {
  return (
    <div
      className={`${styles.featureItem} ${
        isActive ? styles.activeFeature : ""
      }`}
      onClick={onFeatureClick}
    >
      <div className={styles.featureIcon}>{icon}</div>
      <div className={styles.featureContent}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function RemixIntegration(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<
    "traditional" | "model" | "component"
  >("model");

  // Add state for active feature
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Function to handle feature click
  const handleFeatureClick = (feature: string) => {
    setActiveFeature(activeFeature === feature ? null : feature);
  };

  // Function to get the line highlight string for Docusaurus
  const getLineHighlightString = () => {
    if (!activeFeature) return "";

    const range = highlightRanges[activeTab][activeFeature];
    if (!range || range[0] === 0) return "";

    // Format for Docusaurus metastring
    return range[0] === range[1]
      ? `{${range[0]}}`
      : `{${range[0]}-${range[1]}}`;
  };

  const traditionalCode = `// Traditional Remix Approach (without jods)

// loader.ts
export async function loader() {
  const todos = await db.getTodos();
  return json({ todos });
}

// action.ts
export async function action({ request }) {
  const form = await request.formData();
  const title = form.get("title");
  
  await db.createTodo({ title });
  return redirect("/todos");
}

// Component.tsx
function Todos() {
  const { todos } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Todos ({todos.length})</h1>
      
      <Form method="post">
        <input name="title" placeholder="New todo..." />
        <button type="submit">Add</button>
      </Form>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.title}
            {todo.completed ? " ✓" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}`;

  const modelCode = `// todos.jods.ts
import { z } from "zod";
import { defineStore } from "jods/remix";

// Define schema with Zod
const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean().default(false)
});

export const todos = defineStore({
  name: "todos",
  schema: z.object({
    items: z.array(todoSchema)
  }),
  loader: async () => {
    return { items: await db.getTodos() };
  },
  handlers: {
    async addTodo({ current, form }) {
      const title = form.get("title");
      const newTodo = await db.createTodo({ title });
      
      return {
        ...current,
        items: [...current.items, newTodo]
      };
    }
  }
});

// Export for route
export const loader = todos.loader;
export const action = todos.action;`;

  const componentCode = `// todos.tsx
import { useLoaderData, Form } from "@remix-run/react";
import { todos } from "~/todos.jods";
import { useJodsStore, useJodsForm } from "jods/remix";

export default function TodosPage() {
  // Type-safe access to your state
  const { items } = useJodsStore(todos);
  
  // Automatic form handling with action integration
  const form = useJodsForm(todos.handlers.addTodo);
  
  return (
    <div>
      <h1>Todos ({items.length})</h1>
      
      <ul>
        {items.map(todo => (
          <li key={todo.id}>
            {todo.title}
            {todo.completed ? " ✓" : ""}
          </li>
        ))}
      </ul>
      
      {/* Form with automatic action integration */}
      <form {...form.props}>
        <input name="title" placeholder="New todo..." />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}`;

  // Get the line highlight string
  const lineHighlight = getLineHighlightString();

  return (
    <section
      id="remix-integration"
      className={styles.container}
      data-testid="jods-remix-section"
    >
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.remix}>
            <span className={styles.remixIconWrapper}>
              <span className={styles.remixIcon}>💿</span>
            </span>{" "}
            Remix
          </span>{" "}
          <span className={styles.stateText}>State</span>,{" "}
          <span className={styles.reimaginedText}>Reimagined</span>
        </h2>
        <p className={styles.subtitle}>
          <span className={styles.highlight}>
            <span className={styles.rubyIcon}>
              <span className={styles.rubyGem}>💎</span>
            </span>
            Modern Data Layer
          </span>{" "}
          for Remix:
          <br />
          reactive, type-safe, and persistence-ready
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.featuresColumn}>
          <Feature
            icon={
              <span role="img" aria-label="Crystal Ball">
                🔮
              </span>
            }
            title="Automatically syncs"
            description="Server and client state without manual hydration"
            onFeatureClick={() => handleFeatureClick("sync")}
            isActive={activeFeature === "sync"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Refresh">
                🔄
              </span>
            }
            title="Provides true reactivity"
            description="For optimistic UI updates"
            onFeatureClick={() => handleFeatureClick("reactivity")}
            isActive={activeFeature === "reactivity"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Clipboard">
                📝
              </span>
            }
            title="Uses Zod schemas"
            description="For runtime type validation and great DX"
            onFeatureClick={() => handleFeatureClick("zod")}
            isActive={activeFeature === "zod"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Wrench">
                🔧
              </span>
            }
            title="Works with any backend"
            description="(Prisma, MongoDB, SQLite, etc.)"
            onFeatureClick={() => handleFeatureClick("backend")}
            isActive={activeFeature === "backend"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Puzzle">
                🧩
              </span>
            }
            title="Offers a consistent model"
            description="Based pattern across your entire application"
            onFeatureClick={() => handleFeatureClick("model")}
            isActive={activeFeature === "model"}
          />
        </div>

        <div className={styles.codeContainer}>
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${
                activeTab === "traditional" ? styles.activeTab : ""
              }`}
              onClick={() => {
                setActiveTab("traditional");
                setActiveFeature(null);
              }}
            >
              <span className={styles.tabIcon}>💿</span> Traditional Remix
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "model" ? styles.activeTab : ""
              }`}
              onClick={() => {
                setActiveTab("model");
                setActiveFeature(null);
              }}
            >
              <span className={styles.tabIcon}>🐿️</span> 1. jods: Define Model
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "component" ? styles.activeTab : ""
              }`}
              onClick={() => {
                setActiveTab("component");
                setActiveFeature(null);
              }}
            >
              <span className={styles.tabIcon}>🦆</span> 2. jods: Use Component
            </button>
          </div>

          <div className={styles.codeSections}>
            <div
              className={`${styles.codeSection} ${
                activeTab === "traditional" ? styles.active : styles.inactive
              }`}
            >
              <CodeBlock
                language="typescript"
                className="language-typescript"
                metastring={lineHighlight}
              >
                {traditionalCode}
              </CodeBlock>
            </div>
            <div
              className={`${styles.codeSection} ${
                activeTab === "model" ? styles.active : styles.inactive
              }`}
            >
              <CodeBlock
                language="typescript"
                className="language-typescript"
                metastring={lineHighlight}
              >
                {modelCode}
              </CodeBlock>
            </div>
            <div
              className={`${styles.codeSection} ${
                activeTab === "component" ? styles.active : styles.inactive
              }`}
            >
              <CodeBlock
                language="typescript"
                className="language-typescript"
                metastring={lineHighlight}
              >
                {componentCode}
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <a href="/jods/remix" className={styles.remixButton}>
          <span className={styles.remixButtonIcon}>💿</span>
          Explore Remix Integration
        </a>
        <a
          href="https://rubyonrails.org/doctrine"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.railsButton}
        >
          <span className={styles.railsButtonIcon}>💎</span>
          Learn About Active Record
        </a>
      </div>
    </section>
  );
}
