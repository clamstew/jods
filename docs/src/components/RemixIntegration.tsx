import React from "react";
import CodeBlock from "@theme/CodeBlock";
import Link from "@docusaurus/Link";

export default function RemixIntegration(): React.ReactElement {
  return (
    <section
      className="features-container"
      id="remix-integration"
      style={{
        background: "var(--ifm-color-primary-lightest)",
        padding: "4rem 0",
        color: "var(--ifm-font-color-base)",
      }}
    >
      <div className="container">
        <h2
          className="section-title"
          style={{ textAlign: "center", marginBottom: "1rem" }}
        >
          💿 The <span className="gradient-text">Active Record</span> for Remix
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
          jods/remix transforms how you build Remix applications by replacing
          disconnected loaders and actions with a cohesive model-driven
          approach.
        </p>

        <div
          className="grid-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            marginBottom: "3rem",
          }}
        >
          <div
            className="grid-item"
            style={{
              background: "var(--ifm-background-surface-color)",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
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
            <div style={{ flex: 1, minWidth: "300px" }}>
              <CodeBlock language="tsx">
                {`// todos.jods.ts
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
export const action = todos.action;

// Component.tsx
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

        <div
          className="key-benefits"
          style={{
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 auto 3rem",
          }}
        >
          <h3>Unlike other Remix state libraries, jods:</h3>
          <ul
            style={{
              textAlign: "left",
              fontSize: "1.1rem",
              listStyleType: "none",
              padding: 0,
            }}
          >
            <li style={{ padding: "0.5rem 0" }}>
              <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                🔮
              </span>
              Automatically syncs server and client state without manual
              hydration
            </li>
            <li style={{ padding: "0.5rem 0" }}>
              <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                🔄
              </span>
              Provides true reactivity for optimistic UI updates
            </li>
            <li style={{ padding: "0.5rem 0" }}>
              <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                🔧
              </span>
              Works with any backend or database (Prisma, MongoDB, SQLite, etc.)
            </li>
            <li style={{ padding: "0.5rem 0" }}>
              <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                🧩
              </span>
              Offers a consistent model-based pattern across your entire
              application
            </li>
          </ul>
        </div>

        <div className="cta-container" style={{ textAlign: "center" }}>
          <Link
            className="button button--primary button--lg"
            to="/docs/remix"
            style={{
              fontWeight: "bold",
              padding: "0.8rem 1.5rem",
              borderRadius: "8px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            }}
          >
            Explore Remix Integration →
          </Link>
        </div>
      </div>
    </section>
  );
}
