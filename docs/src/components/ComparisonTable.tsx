import React from "react";
import Translate from "@docusaurus/Translate";
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
          <Translate id="homepage.comparison.title.prefix">
            {"How jods "}
          </Translate>
          <span className="gradient-text">
            <Translate id="homepage.comparison.title.gradient">
              {"compares"}
            </Translate>
          </span>
          <Translate id="homepage.comparison.title.suffix">{" 📊"}</Translate>
        </h2>
        <p
          style={{
            textAlign: "center",
            maxWidth: "700px",
            margin: "0 auto 2rem",
            fontSize: "1.1rem",
            fontWeight: "500",
            background: "linear-gradient(90deg, #9d4edd, #00b4d8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          <Translate
            id="homepage.comparison.tagline"
            description="Tagline for the comparison table section"
          >
            Byte-sized brilliance — compact code wielding cosmic-scale
            capabilities 💠
          </Translate>
        </p>

        <div className={styles.container}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeaderCell}>
                  <Translate
                    id="homepage.comparison.header.feature"
                    description="Feature header in comparison table"
                  >
                    Feature
                  </Translate>
                </th>
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
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.bundle_size"
                      description="Bundle size feature in comparison table"
                    >
                      📦 Bundle Size
                    </Translate>
                  ),
                  jods: "1 KB",
                  zustand: "3.4 KB",
                  redux: "16.4 KB + Redux Toolkit",
                  signals: "4.2 KB",
                },
                {
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.framework_dependency"
                      description="Framework dependency feature in comparison table"
                    >
                      🔗 Framework Dependency
                    </Translate>
                  ),
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
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.state_access"
                      description="State access feature in comparison table"
                    >
                      🔑 State Access
                    </Translate>
                  ),
                  jods: (
                    <Translate
                      id="homepage.comparison.jods.state_access"
                      description="State access value for jods"
                    >
                      Proxied object (store.foo)
                    </Translate>
                  ),
                  zustand: (
                    <Translate
                      id="homepage.comparison.zustand.state_access"
                      description="State access value for Zustand"
                    >
                      Hook (useStore)
                    </Translate>
                  ),
                  redux: (
                    <Translate
                      id="homepage.comparison.redux.state_access"
                      description="State access value for Redux"
                    >
                      Via selectors
                    </Translate>
                  ),
                  signals: (
                    <Translate
                      id="homepage.comparison.signals.state_access"
                      description="State access value for Preact Signals"
                    >
                      Signal.value or JSX unwrap
                    </Translate>
                  ),
                },
                {
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.direct_mutations"
                      description="Direct mutations feature in comparison table"
                    >
                      ✏️ Direct Mutations
                    </Translate>
                  ),
                  jods: <span className={styles.greenCheck}>✅</span>,
                  zustand: <span className={styles.greenCheck}>✅</span>,
                  redux: (
                    <span className={styles.featureMissing}>
                      <Translate
                        id="homepage.comparison.redux.direct_mutations"
                        description="Direct mutations value for Redux"
                      >
                        👨‍💻 (requires action creators)
                      </Translate>
                    </span>
                  ),
                  signals: (
                    <Translate
                      id="homepage.comparison.signals.direct_mutations"
                      description="Direct mutations value for Preact Signals"
                    >
                      signal.value = x
                    </Translate>
                  ),
                },
                {
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.computed_values"
                      description="Computed values feature in comparison table"
                    >
                      🧮 Computed Values
                    </Translate>
                  ),
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
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.json_snapshots"
                      description="JSON snapshots feature in comparison table"
                    >
                      📸 JSON Snapshots
                    </Translate>
                  ),
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
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.built_in_diff"
                      description="Built-in diff feature in comparison table"
                    >
                      🔄 Built-in diff
                    </Translate>
                  ),
                  jods: <span className={styles.greenCheck}>✅</span>,
                  zustand: <span className={styles.featureMissing}>🤷</span>,
                  redux: <span className={styles.featureMissing}>🤷</span>,
                  signals: <span className={styles.featureMissing}>🤷</span>,
                },
                {
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.time_travel_debugging"
                      description="Time-travel debugging feature in comparison table"
                    >
                      ⏮️ Time-travel Debugging
                    </Translate>
                  ),
                  jods: <span className={styles.greenCheck}>✅</span>,
                  zustand: <span className={styles.greenCheck}>✅</span>,
                  redux: <span className={styles.greenCheck}>✅</span>,
                  signals: <span className={styles.featureMissing}>⏱️</span>,
                },
                {
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.conceptual_simplicity"
                      description="Conceptual simplicity feature in comparison table"
                    >
                      🧠 Conceptual Simplicity
                    </Translate>
                  ),
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
                  feature: (
                    <Translate
                      id="homepage.comparison.feature.server_integration"
                      description="Server integration feature in comparison table"
                    >
                      🖥️ Server Integration
                    </Translate>
                  ),
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
