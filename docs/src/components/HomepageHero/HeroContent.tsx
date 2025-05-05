import React from "react";
import Link from "@docusaurus/Link";

export default function HeroContent(): React.ReactElement {
  return (
    <div className="hero-content">
      <h1 className="hero-title">
        <span className="jods-logo">
          <span className="jods-logo-braces">{"{"}</span>
          jods
          <span className="jods-logo-braces">{"}"}</span>
        </span>
      </h1>

      <p className="hero-subtitle">
        <span className="emoji">✨</span>
        JSON Dynamics System
        <span className="emoji">🔄</span>
      </p>

      <p className="hero-description">Brings JSON to life</p>

      <div className="hero-features">
        <span>🌱 Minimal</span>
        <span className="separator">•</span>
        <span>🔍 Typesafe</span>
        <span className="separator">•</span>
        <span>⚡ Fast</span>
      </div>

      <div className="hero-buttons">
        <Link to="/intro" className="button button--primary">
          Get Started
        </Link>
        <Link to="/examples" className="button button--secondary">
          See Examples
        </Link>
      </div>
    </div>
  );
}
