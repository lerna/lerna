import clsx from "clsx";
import React from "react";
import styles from "./publish-with-lerna.module.css";

export default function PublishWithLerna(): JSX.Element {
  return (
    <section className="padding-vert--xl container">
      <div className={clsx("row row--no-gutters shadow--md", styles.item)}>
        <div className={clsx("col col--6", styles.item__inner)}>
          <div>
            <h1 className="margin-bottom--md">Ultimate Tool for Publishing Packages</h1>
            <p className="margin-bottom--md">
              Lerna is the ultimate tool for publishing multiple packages to npm. Whether the packages have
              independent versions or not, Lerna's got you covered.
            </p>
            <a className="button button--secondary" href="/docs/features/version-and-publish">
              Publishing Packages
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
