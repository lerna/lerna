import { ChevronRightIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./hero-lerna.module.css";
import LernaIcon from "./lerna-icon";

export default function HeroLerna(): JSX.Element {
  const command = "npx lerna init";

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (copied) {
      t = setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
    return () => {
      t && clearTimeout(t);
    };
  }, [copied]);

  return (
    <section className="padding-vert--xl">
      <div className="container">
        <div className="row">
          <div className="col col--8 margin-vert--xl">
            <a
              href="https://github.com/lerna/lerna/issues/3121"
              target="_blank"
              rel="noreferrer"
              className={styles.callout}
            >
              <span className="badge badge--primary callout__badge">NEW</span>
              <span className={styles.callout__text}>Nrwl takes stewardship!</span>
              <ChevronRightIcon className={styles.callout__icon} aria-hidden="true" />
            </a>
            <h1 className={styles.slogan}>
              <span>The Original Tool for</span>
              <span className={styles.slogan__highlight}>JavaScript Monorepos</span>
            </h1>
            <p className={styles.description}>
              Lerna is a fast, modern build system for managing and publishing multiple JavaScript/TypeScript
              packages from the same repository.
            </p>
            <div className="padding-vert--md row">
              <div className="col col--5">
                <a href="/docs/getting-started" className="button button--lg button--block button--primary">
                  Get Started
                </a>
              </div>
              <div className="col col--5">
                <CopyToClipboard
                  text={command}
                  onCopy={() => {
                    setCopied(true);
                  }}
                >
                  <button
                    className={clsx(
                      "button button--lg button--block button--outline button--secondary",
                      styles.command
                    )}
                  >
                    <span className={styles.command__text}>
                      <span aria-hidden="true">$</span> {command}
                    </span>
                    <DocumentDuplicateIcon className={styles.command__icon} />
                  </button>
                </CopyToClipboard>
              </div>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.illustration}>
              <div
                className={styles.illustration__container}
                style={{ backgroundImage: 'url("/images/background/blob-lerna-vertical.svg")' }}
              >
                <LernaIcon className={styles.illustration__svg} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
