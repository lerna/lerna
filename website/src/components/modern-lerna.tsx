import clsx from "clsx";
import React from "react";
import styles from "./about-lerna.module.css";

export default function ModernLerna(): JSX.Element {
  return (
    <section className="padding-vert--xl container">
      <div className={clsx("row margin-bottom--xl", styles.hero)}>
        <div className="col col--6">
          <div>
            <h1 className={clsx("margin-bottom--lg", styles.hero__title)}>
              What is <br /> Modern Lerna?
            </h1>
            <p className={clsx("margin-bottom--md", styles.hero__text)}>
              Lerna is now faster, more reliable, and more powerful than ever. The "new Lerna" comes with
              modern features such as local & remote caching support, task pipelines, improved terminal
              output, Prettier & NPM/Yarn/PNPM workspaces support combined with what the community already
              loved: a built-in versioning and publishing workflow.
            </p>
          </div>
        </div>
        <div className="col col--6">
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/1oxFYphTS4Y"
            title=" Modern Lerna Walkthrough "
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.video}
          ></iframe>
        </div>
      </div>
    </section>
  );
}
