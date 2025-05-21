import React, { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Translate from "@docusaurus/Translate";
import styles from "./FooterLinks.module.css";

interface FooterColumn {
  title: ReactNode;
  items: Array<{
    label: ReactNode;
    to: string;
    isExternal?: boolean;
  }>;
}

// Translations now come from homepage-components/footer.json
const footerColumns: FooterColumn[] = [
  {
    title: <Translate id="footer.title.documentation">DOCUMENTATION</Translate>,
    items: [
      {
        label: (
          <Translate
            id="footer.item.label.getting-started"
            description="Footer link to getting started page"
          >
            📚 Getting Started
          </Translate>
        ),
        to: "/intro",
      },
      {
        label: (
          <Translate
            id="footer.item.label.about-jods"
            description="Footer link to about page"
          >
            ℹ️ About jods
          </Translate>
        ),
        to: "/about",
      },
      {
        label: (
          <Translate
            id="footer.item.label.api-reference"
            description="Footer link to API reference page"
          >
            🧩 API Reference
          </Translate>
        ),
        to: "/api-reference",
      },
    ],
  },
  {
    title: <Translate id="footer.title.community">COMMUNITY</Translate>,
    items: [
      {
        label: (
          <Translate
            id="footer.item.label.discussions"
            description="Footer link to GitHub discussions"
          >
            💬 Discussions
          </Translate>
        ),
        to: "https://github.com/clamstew/jods/discussions",
        isExternal: true,
      },
      {
        label: (
          <Translate
            id="footer.item.label.issues"
            description="Footer link to GitHub issues"
          >
            🐛 Issues
          </Translate>
        ),
        to: "https://github.com/clamstew/jods/issues",
        isExternal: true,
      },
      {
        label: (
          <Translate
            id="footer.item.label.creator"
            description="Footer link to creator's GitHub profile"
          >
            👨‍💻 Creator
          </Translate>
        ),
        to: "https://github.com/clamstew",
        isExternal: true,
      },
    ],
  },
  {
    title: <Translate id="footer.title.resources">RESOURCES</Translate>,
    items: [
      {
        label: (
          <Translate
            id="footer.item.label.blog"
            description="Footer link to blog"
          >
            📝 Blog
          </Translate>
        ),
        to: "/blog",
      },
      {
        label: (
          <Translate
            id="footer.item.label.github"
            description="Footer link to GitHub repository"
          >
            🐙 GitHub
          </Translate>
        ),
        to: "https://github.com/clamstew/jods",
        isExternal: true,
      },
      {
        label: (
          <Translate
            id="footer.item.label.npm"
            description="Footer link to npm package"
          >
            📦 npm
          </Translate>
        ),
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
