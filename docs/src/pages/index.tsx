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
      title={`${siteConfig.title} - JSON On Demand Store`}
      description="A minimal, reactive JSON state layer for Node.js and the browser"
    >
      <HomepageHero />
      <FeatureHighlights />
      <InteractiveDemo />
      <FrameworkShowcase />
      <ComparisonTable />
    </Layout>
  );
}
