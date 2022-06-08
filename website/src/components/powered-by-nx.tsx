import clsx from "clsx";
import React from "react";
import styles from "./publish-with-lerna.module.css";

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
            <h1 className="margin-bottom--md">Faster task orchestration engine powered by Nx</h1>
            <p className="margin-bottom--md">
              Same old Lerna but with a new engine, see how to activate the fastest Lerna experience for your
              projects in one line (yes, seriously).
            </p>
            <a className="button button--secondary" href="#url">
              Check Nx orchestration engine
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
