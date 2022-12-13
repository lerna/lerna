import React from "react";
import styles from "./how-to-upgrade.module.css";
export default function HowToUpgrade(): JSX.Element {
  return (
    <section className="padding-vert--xl container">
      <div className="row">
        <div className="col col--6">
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/MwGPMvhJS0A"
            title="How to upgrade Lerna in 3 minutes"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.video}
          ></iframe>
          <p className={styles.description}>How to upgrade Lerna in 3 minutes</p>
        </div>
        <div className="col col--6">
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/jaH2BqWo-Pc"
            title="How to add caching to Lerna in once command"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.video}
          ></iframe>
          <p className={styles.description}>How to add caching to Lerna in one command</p>
        </div>
      </div>
    </section>
  );
}
