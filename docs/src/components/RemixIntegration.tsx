import React, { useState } from "react";
import styles from "./RemixIntegration.module.css";
import CodeBlock from "@theme/CodeBlock";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className={styles.featureItem}>
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.remix}>💿 Remix</span> State, Reimagined
        </h2>
        <p className={styles.subtitle}>
          <span className={styles.highlight}>Active Record pattern</span> for
          Remix:
          <br />
          simple, reactive, type-safe state management
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
          />
          <Feature
            icon={
              <span role="img" aria-label="Refresh">
                🔄
              </span>
            }
            title="Provides true reactivity"
            description="For optimistic UI updates"
          />
          <Feature
            icon={
              <span role="img" aria-label="Clipboard">
                📝
              </span>
            }
            title="Uses Zod schemas"
            description="For runtime type validation and great DX"
          />
          <Feature
            icon={
              <span role="img" aria-label="Wrench">
                🔧
              </span>
            }
            title="Works with any backend"
            description="(Prisma, MongoDB, SQLite, etc.)"
          />
          <Feature
            icon={
              <span role="img" aria-label="Puzzle">
                🧩
              </span>
            }
            title="Offers a consistent model"
            description="Based pattern across your entire application"
          />
        </div>

        <div className={styles.codeContainer}>
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tab} ${
                activeTab === "traditional" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("traditional")}
            >
              <span className={styles.tabIcon}>💿</span> Traditional Remix
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "model" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("model")}
            >
              <span className={styles.tabIcon}>🐿️</span> 1. jods: Define Model
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "component" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("component")}
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
              <CodeBlock language="typescript" className="language-typescript">
                {traditionalCode}
              </CodeBlock>
            </div>
            <div
              className={`${styles.codeSection} ${
                activeTab === "model" ? styles.active : styles.inactive
              }`}
            >
              <CodeBlock language="typescript" className="language-typescript">
                {modelCode}
              </CodeBlock>
            </div>
            <div
              className={`${styles.codeSection} ${
                activeTab === "component" ? styles.active : styles.inactive
              }`}
            >
              <CodeBlock language="typescript" className="language-typescript">
                {componentCode}
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <a href="/jods/remix" className={styles.button}>
          Explore Remix Integration →
        </a>
      </div>
    </div>
  );
}
