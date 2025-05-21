import React, { useState } from "react";
import Translate from "@docusaurus/Translate";
import styles from "./RemixIntegration.module.css";
import CodeBlock from "@theme/CodeBlock";

interface FeatureProps {
  icon: React.ReactNode;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
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
import { j, defineStore } from "jods/remix";

// Define schema with Zod
const todoSchema = j.object({
  id: j.string(),
  title: j.string().min(1),
  completed: j.boolean().default(false)
});

export const todos = defineStore({
  name: "todos",
  schema: j.object({
    items: j.array(todoSchema)
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
import { todos } from "~/todos.jods";
import { useJods } from "jods/remix";

export default function TodosPage() {
  // Type-safe access to your state and behavior
  const { stores, actions, loaderData } = useJods(todos, "addTodo");

  return (
    <div>
      <h1>Todos ({loaderData.items.length})</h1>
      
      <ul>
        {loaderData.items.map(todo => (
          <li key={todo.id}>
            {todo.title}
            {todo.completed ? " ✓" : ""}
          </li>
        ))}
      </ul>

      {/* Form with automatic action integration */}
      <actions.addTodo.Form>
        <input name="title" placeholder="New todo..." />
        <button type="submit">Add</button>
      </actions.addTodo.Form>
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
            <Translate
              id="homepage.remix.title.remix"
              description="Remix part of the Remix integration title"
            >
              Remix
            </Translate>
          </span>{" "}
          <span className={styles.stateText}>
            <Translate
              id="homepage.remix.title.state"
              description="State part of the Remix integration title"
            >
              State
            </Translate>
          </span>
          ,{" "}
          <span className={styles.reimaginedText}>
            <Translate
              id="homepage.remix.title.reimagined"
              description="Reimagined part of the Remix integration title"
            >
              Reimagined
            </Translate>
          </span>
        </h2>
        <p className={styles.subtitle}>
          <span className={styles.highlight}>
            <span className={styles.rubyIcon}>
              <span className={styles.rubyGem}>💎</span>
            </span>
            <Translate
              id="homepage.remix.subtitle.modern"
              description="Modern data layer subtitle for Remix integration"
            >
              Modern Data Layer
            </Translate>
          </span>{" "}
          <Translate
            id="homepage.remix.subtitle.for_remix"
            description="For Remix subtitle"
          >
            for Remix
          </Translate>
          :
          <br />
          <Translate
            id="homepage.remix.subtitle.description"
            description="Description in subtitle for Remix integration"
          >
            reactive, type-safe, and persistence-ready
          </Translate>
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
            title={
              <Translate
                id="homepage.remix.features.sync.title"
                description="Sync feature title in Remix integration"
              >
                Automatically syncs
              </Translate>
            }
            description={
              <Translate
                id="homepage.remix.features.sync.description"
                description="Sync feature description in Remix integration"
              >
                Server and client state without manual hydration
              </Translate>
            }
            onFeatureClick={() => handleFeatureClick("sync")}
            isActive={activeFeature === "sync"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Refresh">
                🔄
              </span>
            }
            title={
              <Translate
                id="homepage.remix.features.reactivity.title"
                description="Reactivity feature title in Remix integration"
              >
                Provides true reactivity
              </Translate>
            }
            description={
              <Translate
                id="homepage.remix.features.reactivity.description"
                description="Reactivity feature description in Remix integration"
              >
                For optimistic UI updates
              </Translate>
            }
            onFeatureClick={() => handleFeatureClick("reactivity")}
            isActive={activeFeature === "reactivity"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Clipboard">
                📝
              </span>
            }
            title={
              <Translate
                id="homepage.remix.features.zod.title"
                description="Zod feature title in Remix integration"
              >
                Uses Zod schemas
              </Translate>
            }
            description={
              <Translate
                id="homepage.remix.features.zod.description"
                description="Zod feature description in Remix integration"
              >
                For runtime type validation and great DX
              </Translate>
            }
            onFeatureClick={() => handleFeatureClick("zod")}
            isActive={activeFeature === "zod"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Wrench">
                🔧
              </span>
            }
            title={
              <Translate
                id="homepage.remix.features.backend.title"
                description="Backend feature title in Remix integration"
              >
                Works with any backend
              </Translate>
            }
            description={
              <Translate
                id="homepage.remix.features.backend.description"
                description="Backend feature description in Remix integration"
              >
                (Prisma, MongoDB, SQLite, etc.)
              </Translate>
            }
            onFeatureClick={() => handleFeatureClick("backend")}
            isActive={activeFeature === "backend"}
          />
          <Feature
            icon={
              <span role="img" aria-label="Puzzle">
                🧩
              </span>
            }
            title={
              <Translate
                id="homepage.remix.features.model.title"
                description="Model feature title in Remix integration"
              >
                Offers a consistent model
              </Translate>
            }
            description={
              <Translate
                id="homepage.remix.features.model.description"
                description="Model feature description in Remix integration"
              >
                Based pattern across your entire application
              </Translate>
            }
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
              <span className={styles.tabIcon}>💿</span>
              <span className={styles.tabTextDesktop}>
                <Translate
                  id="homepage.remix.tabs.traditional"
                  description="Traditional Remix tab label"
                >
                  Traditional Remix
                </Translate>
              </span>
              <span className={styles.tabTextMobile}>
                <Translate
                  id="homepage.remix.tabs.traditional_short"
                  description="Short label for Traditional Remix tab on mobile"
                >
                  Traditional
                </Translate>
              </span>
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
              <span className={styles.tabIcon}>🐿️</span>
              <span className={styles.tabTextDesktop}>
                <Translate
                  id="homepage.remix.tabs.model"
                  description="Model tab label in Remix integration"
                >
                  1. jods: Define Model
                </Translate>
              </span>
              <span className={styles.tabTextMobile}>
                <Translate
                  id="homepage.remix.tabs.model_short"
                  description="Short label for Model tab on mobile"
                >
                  1. Model
                </Translate>
              </span>
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
              <span className={styles.tabIcon}>🦆</span>
              <span className={styles.tabTextDesktop}>
                <Translate
                  id="homepage.remix.tabs.component"
                  description="Component tab label in Remix integration"
                >
                  2. jods: Use Component
                </Translate>
              </span>
              <span className={styles.tabTextMobile}>
                <Translate
                  id="homepage.remix.tabs.component_short"
                  description="Short label for Component tab on mobile"
                >
                  2. Component
                </Translate>
              </span>
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
          <span className={styles.buttonTextDesktop}>
            <Translate
              id="homepage.remix.footer.button.explore"
              description="Text for the Explore Remix Integration button"
            >
              Explore Remix Integration
            </Translate>
          </span>
          <span className={styles.buttonTextMobile}>
            <Translate
              id="homepage.remix.footer.button.explore_short"
              description="Short text for the Explore Remix Integration button on mobile"
            >
              Remix Guide
            </Translate>
          </span>
        </a>
        <a
          href="https://rubyonrails.org/doctrine"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.railsButton}
        >
          <span className={styles.railsButtonIcon}>💎</span>
          <span className={styles.buttonTextDesktop}>
            <Translate
              id="homepage.remix.footer.button.active_record"
              description="Text for the Learn About Active Record button"
            >
              Learn About Active Record
            </Translate>
          </span>
          <span className={styles.buttonTextMobile}>
            <Translate
              id="homepage.remix.footer.button.active_record_short"
              description="Short text for the Learn About Active Record button on mobile"
            >
              Active Record
            </Translate>
          </span>
        </a>
      </div>
    </section>
  );
}
