import React from "react";
import Link from "@docusaurus/Link";

export default function HeroContent(): React.ReactElement {
  return (
    <div className="hero-content">
      <h1 className="hero-title">
        <span className="gradient-text">💫 jods &#123;&#125; </span>
      </h1>
      <p className="hero-subtitle">
        <span className="gradient-text">✨</span> JavaScript Object Dynamics
        System 🔄
      </p>
      <p className="hero-description">
        Intuitive reactive state brings JS objects to life
      </p>
      <p className="hero-sub-description">🧩 Minimal • 📐 Typesafe • ⚡ Fast</p>
      <div className="hero-buttons">
        <Link className="button button--primary button--lg" to="/intro">
          Get Started
        </Link>
        <Link className="button button--secondary button--lg" to="/examples">
          See Examples
        </Link>
      </div>
    </div>
  );
}
