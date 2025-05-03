import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageHero from "@site/src/components/HomepageHero";
import FeatureHighlights from "@site/src/components/FeatureHighlights";
import InteractiveDemo from "@site/src/components/InteractiveDemo";
import FrameworkShowcase from "@site/src/components/FrameworkShowcase";
import ComparisonTable from "@site/src/components/ComparisonTable";

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - JavaScript Object Dynamics System`}
      description="A fun, intuitive reactive state library that makes JavaScript objects come alive"
    >
      <HomepageHero />
      <FeatureHighlights />
      <InteractiveDemo />
      <FrameworkShowcase />
      <ComparisonTable />
    </Layout>
  );
}
