import React from "react";
import CustomFooter from "../../components/Footer";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

export default function FooterWrapper(): React.ReactElement {
  // Get i18n context, which is available to child components via context
  useDocusaurusContext();
  return <CustomFooter />;
}
