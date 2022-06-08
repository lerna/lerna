import clsx from "clsx";
import React from "react";
import styles from "./publish-with-lerna.module.css";

export default function PublishWithLerna(): JSX.Element {
  return (
    <section className="padding-vert--xl container">
      <div className={clsx("row row--no-gutters shadow--md", styles.item)}>
        <div className={clsx("col col--6", styles.item__inner)}>
          <div>
            <h1 className="margin-bottom--md">Publish your packages to your community, no headaches</h1>
            <p className="margin-bottom--md">
              Lerna takes care of the publishing task for your affected projects and creates comprehensive
              changelogs. Approved and used by millions of developers.
            </p>
            <a className="button button--secondary" href="#url">
              See how to publish with Lerna
            </a>
          </div>
        </div>
        <div
          className="col col--6"
          aria-hidden="true"
          style={{
            backgroundImage: "url('/images/background/parcel.avif')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right",
          }}
        ></div>
      </div>
    </section>
  );
}
