import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import AgenticAiCallout from "@site/src/components/agentic-ai-callout";
import HeroLerna from "@site/src/components/hero-lerna";
import ProjectsUsingLerna from "@site/src/components/projects-using-lerna";
import PublishWithLerna from "@site/src/components/publish-with-lerna";
import PoweredByNx from "@site/src/components/powered-by-nx";
import AboutLerna from "@site/src/components/about-lerna";

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Lerna is a fast, modern build system for managing and publishing multiple JavaScript/TypeScript packages from the same repository."
    >
      <main>
        <HeroLerna />
        <AgenticAiCallout />
        <ProjectsUsingLerna />
        <PoweredByNx />
        <PublishWithLerna />
        <AboutLerna />
      </main>
    </Layout>
  );
}
