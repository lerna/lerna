import HeroUpgrade from "@site/src/components/hero-upgrade";
import HowToUpgrade from "@site/src/components/how-to-upgrade";
import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import ModernLerna from "../components/modern-lerna";
import Head from "@docusaurus/Head";

export default function Upgrade(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Upgrade" description="Get the latest developer experience from Lerna for your monorepo.">
      <Head>
        <meta property="og:image" content="https://lerna.js.org/images/og-image-lerna-upgrade.jpg" />
      </Head>
      <main>
        <HeroUpgrade />
        <HowToUpgrade />
        <ModernLerna />
      </main>
    </Layout>
  );
}
