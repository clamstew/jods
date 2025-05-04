import React from "react";
import CodeBlock from "@theme/CodeBlock";
import Link from "@docusaurus/Link";

export default function RemixIntegration(): React.ReactElement {
  return (
    <section
      className="features-container"
      id="remix-integration"
      style={{
        background: "var(--ifm-color-emphasis-100)",
        padding: "4rem 0",
        color: "var(--ifm-font-color-base)",
      }}
    >
      <div className="container">
        <h2
          className="section-title"
          style={{ textAlign: "center", marginBottom: "1rem" }}
        >
          The <span className="gradient-text">Active Record</span> for 💿 Remix{" "}
          <sup style={{ fontSize: "0.5em", opacity: "0.7" }}>(potentially)</sup>
        </h2>
        <p
          className="section-description"
          style={{
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 auto 3rem",
            fontSize: "1.2rem",
          }}
        >
          <code>jods/remix</code> transforms how you build Remix applications by
          replacing disconnected loaders and actions with a cohesive{" "}
          <strong>model-driven</strong> approach.
        </p>

        <div
          className="grid-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(300px, 400px))",
            gap: "2rem",
            marginBottom: "3rem",
            justifyContent: "center",
          }}
        >
          <div
            className="grid-item"
            style={{
              background: "var(--ifm-background-surface-color)",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "var(--ifm-global-shadow-lw)",
            }}
          >
            <h3>
              <span style={{ fontSize: "1.4rem", marginRight: "0.5rem" }}>
                🔄
              </span>
              Server/Client State Unification
            </h3>
            <p>
              No more duplicate models! Define your data structure once and use
              it everywhere. jods bridges the gap between server and client
              state with full TypeScript support.
            </p>
          </div>

          <div
            className="grid-item"
            style={{
              background: "var(--ifm-background-surface-color)",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "var(--ifm-global-shadow-lw)",
            }}
          >
            <h3>
              <span style={{ fontSize: "1.4rem", marginRight: "0.5rem" }}>
                📋
              </span>
              Form Management Simplified
            </h3>
            <p>
              Replace complicated form handlers with intuitive models.
              Validation, submissions, and optimistic UI updates are handled
              automatically with minimal boilerplate.
            </p>
          </div>

          <div
            className="grid-item"
            style={{
              background: "var(--ifm-background-surface-color)",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "var(--ifm-global-shadow-lw)",
            }}
          >
            <h3>
              <span style={{ fontSize: "1.4rem", marginRight: "0.5rem" }}>
                🧰
              </span>
              Storage-Agnostic
            </h3>
            <p>
              Use any persistence layer - SQL, NoSQL, localStorage, or even
              memory. jods doesn't care where your data lives, just how it
              behaves.
            </p>
          </div>

          <div
            className="grid-item"
            style={{
              background: "var(--ifm-background-surface-color)",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "var(--ifm-global-shadow-lw)",
            }}
          >
            <h3>
              <span style={{ fontSize: "1.4rem", marginRight: "0.5rem" }}>
                ⚡
              </span>
              Reactive by Default
            </h3>
            <p>
              State changes flow naturally through your application. Components
              re-render only when their specific data dependencies change,
              keeping your app fast and responsive.
            </p>
          </div>
        </div>

        <div
          className="code-showcase"
          style={{
            background: "var(--ifm-background-surface-color)",
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "var(--ifm-global-shadow-lw)",
            marginBottom: "3rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ margin: 0 }}>Before: Traditional Remix</h3>
            <h3 style={{ margin: 0 }}>After: With jods</h3>
          </div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <CodeBlock language="tsx">
                {`// loader.ts
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
      <Form method="post">
        <input name="title" />
        <button type="submit">Add</button>
      </Form>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
}`}
              </CodeBlock>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: "300px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 0.5rem" }}>
                  1. Define the model with Zod
                </h4>
                <CodeBlock language="tsx">
                  {`// todos.jods.ts
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
export const action = todos.action;`}
                </CodeBlock>
              </div>
              <div>
                <h4 style={{ margin: "0 0 0.5rem" }}>
                  2. Import and use in your component
                </h4>
                <CodeBlock language="tsx">
                  {`// Component.tsx - that's all you need!
import { useJodsStore, useJodsForm } from "jods/remix";
import { todos } from "~/jods/todos.jods";

function Todos() {
  const data = useJodsStore(todos);
  const form = useJodsForm(todos.actions.addTodo);
  
  return (
    <div>
      <form {...form.props}>
        <input name="title" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {data.items.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
}`}
                </CodeBlock>
              </div>
            </div>
          </div>
        </div>

        <div
          className="key-benefits"
          style={{
            padding: "0",
            maxWidth: "500px",
            margin: "0 auto 4rem",
            borderRadius: "12px",
            overflow: "hidden",
            background: "var(--ifm-color-primary-darkest)",
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.25)",
          }}
        >
          <h3
            style={{
              textAlign: "center",
              margin: "0",
              padding: "1.5rem",
              color: "white",
              fontSize: "1.8rem",
              fontWeight: "800",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              background: "rgba(0, 0, 0, 0.2)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            Unlike other 💿 Remix state libraries, jods:
          </h3>
          <ul
            style={{
              textAlign: "left",
              listStyleType: "none",
              padding: "1rem",
              margin: "0",
              display: "grid",
              gap: "0.75rem",
              background: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <li
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                background: "rgba(15, 15, 20, 0.7)",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                cursor: "default",
                border: "1px solid rgba(100, 100, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-5px) scale(1.01)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.25)";
                e.currentTarget.style.borderColor = "rgba(120, 120, 255, 0.3)";
                e.currentTarget.style.background = "rgba(20, 20, 35, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.2)";
                e.currentTarget.style.borderColor = "rgba(100, 100, 255, 0.1)";
                e.currentTarget.style.background = "rgba(15, 15, 20, 0.7)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "50px",
                  height: "50px",
                  minWidth: "50px",
                  background: "linear-gradient(135deg, #da4bfc, #9d4edd)",
                  borderRadius: "12px",
                  marginRight: "1.25rem",
                  boxShadow: "0 0 20px rgba(218, 75, 252, 0.5)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🔮</span>
              </div>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "500",
                  lineHeight: "1.4",
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                Automatically syncs server and client state without manual
                hydration
              </span>
            </li>
            <li
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                background: "rgba(15, 15, 20, 0.7)",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                cursor: "default",
                border: "1px solid rgba(100, 100, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-5px) scale(1.01)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.25)";
                e.currentTarget.style.borderColor = "rgba(120, 120, 255, 0.3)";
                e.currentTarget.style.background = "rgba(20, 20, 35, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.2)";
                e.currentTarget.style.borderColor = "rgba(100, 100, 255, 0.1)";
                e.currentTarget.style.background = "rgba(15, 15, 20, 0.7)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "50px",
                  height: "50px",
                  minWidth: "50px",
                  background: "linear-gradient(135deg, #4cc9f0, #4361ee)",
                  borderRadius: "12px",
                  marginRight: "1.25rem",
                  boxShadow: "0 0 20px rgba(76, 201, 240, 0.5)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🔄</span>
              </div>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "500",
                  lineHeight: "1.4",
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                Provides true reactivity for optimistic UI updates
              </span>
            </li>
            <li
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                background: "rgba(15, 15, 20, 0.7)",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                cursor: "default",
                border: "1px solid rgba(100, 100, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-5px) scale(1.01)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.25)";
                e.currentTarget.style.borderColor = "rgba(120, 120, 255, 0.3)";
                e.currentTarget.style.background = "rgba(20, 20, 35, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.2)";
                e.currentTarget.style.borderColor = "rgba(100, 100, 255, 0.1)";
                e.currentTarget.style.background = "rgba(15, 15, 20, 0.7)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "50px",
                  height: "50px",
                  minWidth: "50px",
                  background: "linear-gradient(135deg, #f9c846, #f77f00)",
                  borderRadius: "12px",
                  marginRight: "1.25rem",
                  boxShadow: "0 0 20px rgba(249, 200, 70, 0.5)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>📝</span>
              </div>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "500",
                  lineHeight: "1.4",
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                Uses Zod schemas for runtime type validation and great DX
              </span>
            </li>
            <li
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                background: "rgba(15, 15, 20, 0.7)",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                cursor: "default",
                border: "1px solid rgba(100, 100, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-5px) scale(1.01)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.25)";
                e.currentTarget.style.borderColor = "rgba(120, 120, 255, 0.3)";
                e.currentTarget.style.background = "rgba(20, 20, 35, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.2)";
                e.currentTarget.style.borderColor = "rgba(100, 100, 255, 0.1)";
                e.currentTarget.style.background = "rgba(15, 15, 20, 0.7)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "50px",
                  height: "50px",
                  minWidth: "50px",
                  background: "linear-gradient(135deg, #52b788, #2d6a4f)",
                  borderRadius: "12px",
                  marginRight: "1.25rem",
                  boxShadow: "0 0 20px rgba(82, 183, 136, 0.5)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🔧</span>
              </div>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "500",
                  lineHeight: "1.4",
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                Works with any backend or database (Prisma, MongoDB, SQLite,
                etc.)
              </span>
            </li>
            <li
              style={{
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                background: "rgba(15, 15, 20, 0.7)",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                cursor: "default",
                border: "1px solid rgba(100, 100, 255, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-5px) scale(1.01)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(0, 0, 0, 0.25)";
                e.currentTarget.style.borderColor = "rgba(120, 120, 255, 0.3)";
                e.currentTarget.style.background = "rgba(20, 20, 35, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.2)";
                e.currentTarget.style.borderColor = "rgba(100, 100, 255, 0.1)";
                e.currentTarget.style.background = "rgba(15, 15, 20, 0.7)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "50px",
                  height: "50px",
                  minWidth: "50px",
                  background: "linear-gradient(135deg, #c77dff, #7b2cbf)",
                  borderRadius: "12px",
                  marginRight: "1.25rem",
                  boxShadow: "0 0 20px rgba(199, 125, 255, 0.5)",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>🧩</span>
              </div>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "500",
                  lineHeight: "1.4",
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                Offers a consistent model-based pattern across your entire
                application
              </span>
            </li>
          </ul>
        </div>

        <div className="cta-container" style={{ textAlign: "center" }}>
          <Link
            className="button button--primary button--lg"
            to="/remix"
            style={{
              fontWeight: "bold",
              padding: "1.2rem 2.5rem",
              borderRadius: "12px",
              fontSize: "1.1rem",
              background: "var(--ifm-color-primary)",
              boxShadow:
                "0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(var(--ifm-color-primary-rgb), 0.1)",
              border: "none",
              color: "white",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 25px rgba(0, 0, 0, 0.25), 0 0 0 3px rgba(var(--ifm-color-primary-rgb), 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(var(--ifm-color-primary-rgb), 0.1)";
            }}
          >
            Explore Remix Integration →
          </Link>
        </div>
      </div>
    </section>
  );
}
