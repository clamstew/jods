import React from "react";

export default function ComparisonTable(): React.ReactElement {
  return (
    <section id="compare" className="features-container">
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
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>jods</th>
                <th>Zustand</th>
                <th>Redux</th>
                <th>MobX</th>
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
                  jods: <span className="green-check">✅</span>,
                  zustand: <span className="green-check">✅</span>,
                  redux: (
                    <span className="red-x">❌ (requires action creators)</span>
                  ),
                  mobx: <span className="green-check">✅</span>,
                },
                {
                  feature: "Built-in Computed Values",
                  jods: <span className="green-check">✅</span>,
                  zustand: <span className="red-x">❌</span>,
                  redux: <span className="red-x">❌ (requires selectors)</span>,
                  mobx: <span className="green-check">✅</span>,
                },
                {
                  feature: "JSON Snapshots",
                  jods: <span className="green-check">✅ (built-in)</span>,
                  zustand: <span className="red-x">❌ (manual)</span>,
                  redux: <span className="green-check">✅ (manual)</span>,
                  mobx: <span className="red-x">❌ (manual)</span>,
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
                  jods: <span className="green-check">✅ (Remix)</span>,
                  zustand: <span className="red-x">❌</span>,
                  redux: <span className="red-x">❌ (manual)</span>,
                  mobx: <span className="red-x">❌ (manual)</span>,
                },
              ].map((row, i) => (
                <tr key={i}>
                  <td>{row.feature}</td>
                  <td>{row.jods}</td>
                  <td>{row.zustand}</td>
                  <td>{row.redux}</td>
                  <td>{row.mobx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
