import React from "react";

export default function ComparisonTable(): React.ReactElement {
  return (
    <section className="features-container">
      <div className="container">
        <h2 className="section-title">
          How jods <span className="gradient-text">compares</span>
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
          style={{
            overflowX: "auto",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--ifm-color-primary-darkest)",
                  color: "white",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "1rem", borderRadius: "8px 0 0 0" }}>
                  Feature
                </th>
                <th
                  style={{
                    padding: "1rem",
                    background: "var(--ifm-color-primary-darker)",
                  }}
                >
                  <strong>jods</strong>
                </th>
                <th style={{ padding: "1rem" }}>Zustand</th>
                <th style={{ padding: "1rem" }}>Redux</th>
                <th style={{ padding: "1rem", borderRadius: "0 8px 0 0" }}>
                  MobX
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
                },
                {
                  feature: "Direct Mutations",
                  jods: "✅",
                  zustand: "✅",
                  redux: "❌ (requires action creators)",
                  mobx: "✅",
                },
                {
                  feature: "Built-in Computed Values",
                  jods: "✅",
                  zustand: "❌",
                  redux: "❌ (requires selectors)",
                  mobx: "✅",
                },
                {
                  feature: "JSON Snapshots",
                  jods: "✅ (built-in)",
                  zustand: "❌ (manual)",
                  redux: "✅ (manual)",
                  mobx: "❌ (manual)",
                },
                {
                  feature: "Framework Support",
                  jods: "React, Preact, Remix",
                  zustand: "React",
                  redux: "React (with bindings)",
                  mobx: "React (with bindings)",
                },
                {
                  feature: "Boilerplate",
                  jods: "Minimal",
                  zustand: "Low",
                  redux: "High",
                  mobx: "Medium",
                },
                {
                  feature: "Server Integration",
                  jods: "✅ (Remix)",
                  zustand: "❌",
                  redux: "❌ (manual)",
                  mobx: "❌ (manual)",
                },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background:
                      i % 2 === 0
                        ? "var(--ifm-background-surface-color)"
                        : "var(--ifm-background-color)",
                  }}
                >
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>
                    {row.feature}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      background:
                        i % 2 === 0
                          ? "rgba(14, 177, 210, 0.1)"
                          : "rgba(14, 177, 210, 0.05)",
                    }}
                  >
                    {row.jods}
                  </td>
                  <td style={{ padding: "1rem" }}>{row.zustand}</td>
                  <td style={{ padding: "1rem" }}>{row.redux}</td>
                  <td style={{ padding: "1rem" }}>{row.mobx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
