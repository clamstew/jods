import React from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./FooterLinks.module.css";

interface FooterColumn {
  title: string;
  items: Array<{
    label: string;
    to: string;
    isExternal?: boolean;
  }>;
}

const footerColumns: FooterColumn[] = [
  {
    title: "DOCUMENTATION",
    items: [
      { label: "📚 Getting Started", to: "/intro" },
      { label: "ℹ️ About jods", to: "/about" },
      { label: "🧰 API Reference", to: "/api-reference" },
    ],
  },
  {
    title: "COMMUNITY",
    items: [
      {
        label: "💬 Discussions",
        to: "https://github.com/clamstew/jods/discussions",
        isExternal: true,
      },
      {
        label: "🐛 Issues",
        to: "https://github.com/clamstew/jods/issues",
        isExternal: true,
      },
      {
        label: "👤 Creator",
        to: "https://github.com/clamstew",
        isExternal: true,
      },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { label: "📝 Blog", to: "/blog" },
      {
        label: "👾 GitHub",
        to: "https://github.com/clamstew/jods",
        isExternal: true,
      },
      {
        label: "📦 npm",
        to: "https://www.npmjs.com/package/jods",
        isExternal: true,
      },
    ],
  },
];

export function FooterLinks(): React.ReactElement {
  return (
    <div className={styles.links}>
      <div className="container">
        <div className="row">
          {footerColumns.map((column, i) => (
            <div key={i} className={`col ${styles.column}`}>
              <div className={styles.title}>{column.title}</div>
              <ul className={styles.items}>
                {column.items.map((item, j) => (
                  <li key={j} className={styles.item}>
                    {item.isExternal ? (
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link to={useBaseUrl(item.to)}>{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
