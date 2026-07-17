import React from "react";
import styles from "./agentic-ai-callout.module.css";

function PolygraphMark(): React.JSX.Element {
  return (
    <svg
      className={styles.callout__mark}
      viewBox="0 0 154 137"
      fill="currentColor"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M96.779 53.794c1.126 1.95 3.941 1.95 5.067 0l30.213-52.33a2.925 2.925 0 0 1 3.996-1.071l9.572 5.526a2.925 2.925 0 0 1 1.071 3.997l-30.212 52.33c-1.126 1.951.281 4.39 2.534 4.39l31.249-.001a2.926 2.926 0 0 1 2.925 2.926v11.052a2.926 2.926 0 0 1-2.925 2.926H119.02c-2.253 0-3.66 2.438-2.534 4.389l22.085 38.253a2.925 2.925 0 0 1-1.071 3.997l-9.571 5.526a2.925 2.925 0 0 1-3.997-1.071L101.846 96.38c-1.126-1.95-3.941-1.95-5.067 0l-15.625 27.063a2.927 2.927 0 0 1-3.997 1.071l-9.572-5.527a2.925 2.925 0 0 1-1.07-3.996l15.624-27.063c1.127-1.95-.281-4.39-2.533-4.389H2.926A2.926 2.926 0 0 1 0 80.613V69.561a2.926 2.926 0 0 1 2.926-2.926h76.68c2.252 0 3.66-2.438 2.533-4.389L66.515 35.184a2.926 2.926 0 0 1 1.07-3.997l9.572-5.527a2.926 2.926 0 0 1 3.997 1.071z" />
    </svg>
  );
}

export default function AgenticAiCallout(): React.JSX.Element {
  return (
    <div className="container padding-bottom--xl">
      <p className={styles.callout}>
        In agentic AI workflows, Lerna helps{" "}
        <a href="https://metaharness.tools?utm_source=lerna.js.org" target="_blank" rel="noreferrer">
          Meta-Harnesses
        </a>{" "}
        like{" "}
        <a
          href="https://trypolygraph.com?utm_source=lerna.js.org"
          target="_blank"
          rel="noreferrer"
          className={styles.callout__polygraph}
        >
          <PolygraphMark />
          Polygraph
        </a>{" "}
        deeply understand your codebase for maximum token efficiency.{" "}
        <a href="/docs/lerna-and-ai" className={styles.callout__more}>
          Learn more
        </a>
      </p>
    </div>
  );
}
