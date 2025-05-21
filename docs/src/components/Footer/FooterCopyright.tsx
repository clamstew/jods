import React from "react";
import Translate from "@docusaurus/Translate";
import styles from "./FooterCopyright.module.css";

export function FooterCopyright(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.copyright}>
      <div>
        <Translate
          id="footer.copyright.builtWith"
          description="Footer text indicating the site was built with love"
          values={{
            heart: <span className={styles.heart}>💜</span>,
            creator: (
              <a
                href="https://github.com/clamstew"
                target="_blank"
                rel="noopener noreferrer"
              >
                clamstew
              </a>
            ),
          }}
        >
          {"Built with {heart} by {creator}"}
        </Translate>
      </div>
      <div>
        <Translate
          id="footer.copyright.notice"
          description="Copyright notice"
          values={{
            year: currentYear,
          }}
        >
          {"Copyright © {year} jods contributors"}
        </Translate>
      </div>
    </div>
  );
}
