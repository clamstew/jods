import React from "react";

export function FooterCopyright(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer__copyright">
      <div>
        Built with <span className="footer__heart">💚</span> by{" "}
        <a
          href="https://github.com/clamstew"
          target="_blank"
          rel="noopener noreferrer"
        >
          clamstew
        </a>
      </div>
      <div>Copyright © {currentYear} jods contributors</div>
    </div>
  );
}
