import React from "react";

export default function ComparisonTable(): React.ReactElement {
  return (
    <section id="compare" className="features-container">
      <div className="container">
        <h2 className="section-title">
          How jods <span className="gradient-text">compares</span> 📊
        </h2>
        <p
          style={{
            textAlign: "center",
            maxWidth: "700px",
            margin: "0 auto 2rem",
          }}
        >
          See how jods stacks up against other popular state management
          libraries
        </p>

        <div
          className="table-container"
          style={{
            overflowX: "auto",
            maxWidth: "900px",
            margin: "0 auto",
            borderRadius: "8px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
          }}
        >
          <table style={{ margin: 0, boxShadow: "none" }}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>
                  <a
                    href="https://github.com/clamstew/jods"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    jods
                  </a>
                </th>
                <th>
                  <a
                    href="https://github.com/pmndrs/zustand"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    Zustand
                  </a>
                </th>
                <th>
                  <a
                    href="https://github.com/reduxjs/redux"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    Redux
                  </a>
                </th>
                <th>
                  <a
                    href="https://github.com/mobxjs/mobx"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    MobX
                  </a>
                </th>
                <th>
                  <a
                    href="https://github.com/preactjs/signals"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    Preact Signals
                  </a>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  feature: "Bundle Size",
                  jods: "1 KB",
                  zustand: "3.4 KB",
                  redux: "16.4 KB + Redux Toolkit",
                  mobx: "22.5 KB",
                  signals: "4.2 KB",
                },
                {
                  feature: "Framework Dependency",
                  jods: <span className="green-check">None</span>,
                  zustand: "React-only",
                  redux: "Framework-agnostic",
                  mobx: "Framework-agnostic",
                  signals: "Preact-only",
                },
                {
                  feature: "State Access",
                  jods: "Proxied object (store.foo)",
                  zustand: "Hook (useStore)",
                  redux: "Via selectors",
                  mobx: "Via observable properties",
                  signals: "Signal.value or JSX unwrap",
                },
                {
                  feature: "Direct Mutations",
                  jods: <span className="green-check">✅</span>,
                  zustand: <span className="green-check">✅</span>,
                  redux: (
                    <span className="red-x">❌ (requires action creators)</span>
                  ),
                  mobx: <span className="green-check">✅</span>,
                  signals: "signal.value = x",
                },
                {
                  feature: "Computed Values",
                  jods: <span className="green-check">✅ via computed()</span>,
                  zustand: (
                    <span className="red-x">😬 with selector functions</span>
                  ),
                  redux: <span className="red-x">❌ (requires selectors)</span>,
                  mobx: <span className="green-check">✅</span>,
                  signals: (
                    <span className="green-check">✅ via computed()</span>
                  ),
                },
                {
                  feature: "JSON Snapshots",
                  jods: <span className="green-check">✅ (built-in)</span>,
                  zustand: <span className="red-x">❌ (manual)</span>,
                  redux: <span className="green-check">✅ (manual)</span>,
                  mobx: <span className="red-x">❌ (manual)</span>,
                  signals: <span className="red-x">❌ (manual)</span>,
                },
                {
                  feature: "Built-in diff",
                  jods: <span className="green-check">✅</span>,
                  zustand: <span className="red-x">❌</span>,
                  redux: <span className="red-x">❌</span>,
                  mobx: <span className="red-x">❌</span>,
                  signals: <span className="red-x">❌</span>,
                },
                {
                  feature: "Dev Tools",
                  jods: "🔮 Not yet",
                  zustand: <span className="green-check">✅</span>,
                  redux: <span className="green-check">✅</span>,
                  mobx: <span className="green-check">✅</span>,
                  signals: <span className="red-x">❌</span>,
                },
                {
                  feature: "Conceptual Simplicity",
                  jods: (
                    <span className="green-check">
                      ✅ very small mental model
                    </span>
                  ),
                  zustand: (
                    <span className="green-check">
                      ✅ (no actions/selectors)
                    </span>
                  ),
                  redux: <span className="red-x">❌ (complex patterns)</span>,
                  mobx: "Medium",
                  signals: (
                    <span className="red-x">
                      ❌ (signals take time to grok)
                    </span>
                  ),
                },
                {
                  feature: "Server Integration",
                  jods: <span className="green-check">✅ (Remix)</span>,
                  zustand: <span className="red-x">❌</span>,
                  redux: <span className="red-x">❌ (manual)</span>,
                  mobx: <span className="red-x">❌ (manual)</span>,
                  signals: <span className="red-x">❌</span>,
                },
              ].map((row, i) => (
                <tr key={i}>
                  <td>{row.feature}</td>
                  <td>{row.jods}</td>
                  <td>{row.zustand}</td>
                  <td>{row.redux}</td>
                  <td>{row.mobx}</td>
                  <td>{row.signals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
