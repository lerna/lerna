import clsx from "clsx";
import React from "react";
import styles from "./powered-by-nx.module.css";

export default function PoweredByNx(): JSX.Element {
  return (
    <section className="padding-vert--xl container">
      <div className={clsx("row row--no-gutters shadow--md", styles.item)}>
        <div
          className="col col--6"
          aria-hidden="true"
          style={{
            backgroundImage: "url('/images/background/rocket.avif')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        ></div>
        <div className={clsx("col col--6", styles.item__inner)}>
          <div>
            <h1 className={clsx("margin-bottom--md", styles.item__title)}>
              Fastest Build System <span>Powered by Nx</span>
            </h1>
            <p className="margin-bottom--md">
              Lerna runs a command against any number of projects in the most efficient way, in the right
              order, in parallel, using advanced caching and with the possibility to distribute that on
              multiple machines.
            </p>
            <a className="button button--secondary" href="/docs/features/run-tasks">
              Running Tasks
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
