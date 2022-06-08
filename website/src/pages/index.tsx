import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HeroLerna from "@site/src/components/hero-lerna";
import ProjectsUsingLerna from "@site/src/components/projects-using-lerna";
import PublishWithLerna from "@site/src/components/publish-with-lerna";
import PoweredByNx from "@site/src/components/powered-by-nx";
import AboutLerna from "@site/src/components/about-lerna";

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Documentation`}
      description="Lerna is the standard tool for managing and publishing versioned Javascript packages from a same repository."
    >
      <main>
        <HeroLerna />
        <ProjectsUsingLerna />
        <PublishWithLerna />
        <PoweredByNx />
        <AboutLerna />
      </main>
    </Layout>
  );
}
