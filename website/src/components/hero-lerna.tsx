import { ChevronRightIcon, DuplicateIcon } from "@heroicons/react/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import React, { useEffect, useState } from "react";
import Translate from '@docusaurus/Translate';
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
              <span className={styles.callout__text}>
                <Translate>Nrwl takes stewardship!</Translate>
              </span>
              <ChevronRightIcon className={styles.callout__icon} aria-hidden="true" />
            </a>
            <h1 className={styles.slogan}>
              <Translate>The Original Tool for</Translate>
              <span className={styles.slogan__highlight}>JavaScript <Translate>Monorepos</Translate></span>
            </h1>
            <p className={styles.description}>
              <Translate>Lerna is a fast modern build system for managing and publishing multiple JavaScript/TypeScript
              packages from the same repository.</Translate>
            </p>
            <div className="padding-vert--md row">
              <div className="col col--5">
                <a href="/docs/getting-started" className="button button--lg button--block button--primary">
                  <Translate>Get Started</Translate>
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
                    <DuplicateIcon className={styles.command__icon} />
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
