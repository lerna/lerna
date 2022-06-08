import { CollectionIcon, ShareIcon } from "@heroicons/react/outline";
import { LightningBoltIcon } from "@heroicons/react/solid";
import clsx from "clsx";
import React from "react";
import styles from "./about-lerna.module.css";

interface Callout {
  title: string;
  text: string;
  link: string;
  icon: (props: React.ComponentProps<"svg">) => JSX.Element;
}

const callouts: Callout[] = [
  {
    title: "Manage your projects",
    text:
      "Varius facilisi mauris sed sit. Non sed et duis dui leo, vulputate id malesuada non. Cras aliquet purus dui laoreet diam sed lacus, fames.",
    link: "#",
    icon: CollectionIcon,
  },
  {
    title: "Share your packages",
    text:
      "Varius facilisi mauris sed sit. Non sed et duis dui leo, vulputate id malesuada non. Cras aliquet purus dui laoreet diam sed lacus, fames.",
    link: "#",
    icon: ShareIcon,
  },
  {
    title: "Fast task orchestration engine",
    text:
      "Varius facilisi mauris sed sit. Non sed et duis dui leo, vulputate id malesuada non. Cras aliquet purus dui laoreet diam sed lacus, fames.",
    link: "#",
    icon: LightningBoltIcon,
  },
];

function Callout(props: Callout): JSX.Element {
  return (
    <div className={clsx("margin-top--md card shadow--lw", styles.callout)}>
      <div className="card__header">
        <h3 className={styles.callout__title}>
          <props.icon className={styles.callout__icon} stroke="currentColor" aria-hidden="true" />
          {props.title}
        </h3>
      </div>
      <div className="card__body">
        <p>
          <a href={props.link} className={styles.callout__link}>
            <span className="link--inset" aria-hidden="true"></span>
            {props.text}
          </a>
        </p>
      </div>
      <div className={styles.callout__bottom} />
    </div>
  );
}

export default function AboutLerna(): JSX.Element {
  return (
    <section className="padding-vert--xl container">
      <div className={clsx("row margin-bottom--xl", styles.hero)}>
        <div className="col col--8">
          <div>
            <h1 className={clsx("margin-bottom--lg", styles.hero__title)}>Why Lerna?</h1>
            <p className={clsx("margin-bottom--md", styles.hero__text)}>
              Splitting up large codebase into separate independently versioned packages is extremely useful
              for code sharing. However, making changes across many repositories is messy and difficult to
              track, and testing across repositories gets complicated really fast.
            </p>
            <p className={clsx("margin-bottom--md", styles.hero__text)}>
              To solve these (and many other) problems, some projects will organize their codebases into
              multi-package repositories. Projects like Babel, React, Angular, Ember, Meteor, Jest, and many
              others develop all of their packages within a single repository.
            </p>
          </div>
        </div>
      </div>
      <div className="row">
        {callouts.map((c) => (
          <div key={c.title} className="col col--4">
            <Callout title={c.title} text={c.text} link={c.link} icon={c.icon} />
          </div>
        ))}
      </div>
    </section>
  );
}
