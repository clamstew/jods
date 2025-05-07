import React from "react";
import styles from "./ComparisonTable.module.css";

export default function ComparisonTable(): React.ReactElement {
  return (
    <section
      id="compare"
      className="features-container"
      data-testid="jods-compare-section"
    >
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

        <div className={styles.container}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeaderCell}>Feature</th>
                <th className={styles.tableHeaderCell}>
                  <a
                    href="https://github.com/clamstew/jods"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    jods
                  </a>
                </th>
                <th className={styles.tableHeaderCell}>
                  <a
                    href="https://github.com/pmndrs/zustand"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    Zustand
                  </a>
                </th>
                <th className={styles.tableHeaderCell}>
                  <a
                    href="https://github.com/reduxjs/redux"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    Redux
                  </a>
                </th>
                <th className={styles.tableHeaderCell}>
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
            <tbody className={styles.tableBody}>
              {[
                {
                  feature: "📦 Bundle Size",
                  jods: "1 KB",
                  zustand: "3.4 KB",
                  redux: "16.4 KB + Redux Toolkit",
                  signals: "4.2 KB",
                },
                {
                  feature: "🔗 Framework Dependency",
                  jods: <span className={styles.greenCheck}>🌱 None</span>,
                  zustand: (
                    <span className={styles.featureMissing}>⚛️ React-only</span>
                  ),
                  redux: (
                    <span className={styles.featureMissing}>
                      🔌 Framework-agnostic
                    </span>
                  ),
                  signals: (
                    <span className={styles.featureMissing}>
                      ⚡ Preact-only
                    </span>
                  ),
                },
                {
                  feature: "🔑 State Access",
                  jods: "Proxied object (store.foo)",
                  zustand: "Hook (useStore)",
                  redux: "Via selectors",
                  signals: "Signal.value or JSX unwrap",
                },
                {
                  feature: "✏️ Direct Mutations",
                  jods: <span className={styles.greenCheck}>✅</span>,
                  zustand: <span className={styles.greenCheck}>✅</span>,
                  redux: (
                    <span className={styles.featureMissing}>
                      👨‍💻 (requires action creators)
                    </span>
                  ),
                  signals: "signal.value = x",
                },
                {
                  feature: "🧮 Computed Values",
                  jods: (
                    <span className={styles.greenCheck}>🧠 via computed()</span>
                  ),
                  zustand: (
                    <span className={styles.featureMissing}>
                      🔧 with selector functions
                    </span>
                  ),
                  redux: (
                    <span className={styles.featureMissing}>
                      🔧 (requires selectors)
                    </span>
                  ),
                  signals: (
                    <span className={styles.greenCheck}>✨ via computed()</span>
                  ),
                },
                {
                  feature: "📸 JSON Snapshots",
                  jods: (
                    <span className={styles.greenCheck}>✅ (built-in)</span>
                  ),
                  zustand: (
                    <span className={styles.featureMissing}>📝 (manual)</span>
                  ),
                  redux: <span className={styles.greenCheck}>✅ (manual)</span>,
                  signals: (
                    <span className={styles.featureMissing}>📝 (manual)</span>
                  ),
                },
                {
                  feature: "🔄 Built-in diff",
                  jods: <span className={styles.greenCheck}>✅</span>,
                  zustand: <span className={styles.featureMissing}>🤷</span>,
                  redux: <span className={styles.featureMissing}>🤷</span>,
                  signals: <span className={styles.featureMissing}>🤷</span>,
                },
                {
                  feature: "⏮️ Time-travel Debugging",
                  jods: <span className={styles.greenCheck}>✅</span>,
                  zustand: <span className={styles.greenCheck}>✅</span>,
                  redux: <span className={styles.greenCheck}>✅</span>,
                  signals: <span className={styles.featureMissing}>⏱️</span>,
                },
                {
                  feature: "🧠 Conceptual Simplicity",
                  jods: (
                    <span className={styles.greenCheck}>
                      ✅ small mental model
                    </span>
                  ),
                  zustand: (
                    <span className={styles.greenCheck}>
                      ✅ (no actions/selectors)
                    </span>
                  ),
                  redux: (
                    <span className={styles.featureMissing}>
                      🧠 (complex patterns)
                    </span>
                  ),
                  signals: (
                    <span className={styles.featureMissing}>
                      🎓 (steep learning curve)
                    </span>
                  ),
                },
                {
                  feature: "🖥️ Server Integration",
                  jods: <span className={styles.greenCheck}>💿 Remix</span>,
                  zustand: (
                    <span className={styles.featureMissing}>🔍 None</span>
                  ),
                  redux: <span className={styles.greenCheck}>✅ (manual)</span>,
                  signals: (
                    <span className={styles.featureMissing}>🔍 None</span>
                  ),
                },
              ].map((row, i) => (
                <tr key={i} className={styles.tableRow}>
                  <td className={`${styles.tableCell} ${styles.featureCell}`}>
                    <strong>{row.feature}</strong>
                  </td>
                  <td className={styles.tableCell}>{row.jods}</td>
                  <td className={styles.tableCell}>{row.zustand}</td>
                  <td className={styles.tableCell}>{row.redux}</td>
                  <td className={styles.tableCell}>{row.signals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
