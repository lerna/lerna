---
id: lerna-and-nx
title: Lerna and Nx
type: explainer
---

# Lerna and Nx

Nrwl (the company behind the open source build system Nx) has taken over [stewardship of Lerna](https://dev.to/nrwl/lerna-is-dead-long-live-lerna-3jal). [Nx](https://nx.dev) is a build system developed by ex-Googlers and utilizes many of the techniques used by internal Google tools. Lerna uses Nx to detect packages in the workspace and dependencies between them. Lerna defers to Nx's powerful task runner to run scripts, allowing you to run them in parallel, cache results, and distribute them across multiple machines, all while ensuring that dependencies between packages are respected.

## Lerna

### Features

1. [Version](./features/version-and-publish) - Automatically increment versions of packages, generate changelog information, create Github releases etc.
2. [Publish](./features/version-and-publish) - Automatically create tags and publish packages to package registries, such as npm

### Cost

Free and open source

### Set up

- `npm install lerna`
- `npx lerna init`

---

## Nx

### Features

1. [Run only tasks affected by a code change](./features/run-tasks)
2. [Run prerequisite tasks first](./features/run-tasks)
3. [Cache task results locally](./features/cache-tasks)
4. [Visualize the project graph](./features/project-graph)
5. [Nx Console](./features/editor-integrations#nx-console-for-vscode) - Visual Studio Code plugin

### Cost

Free and open source

### Set up

- `npx lerna add-caching`
- Continue using Lerna as usual

:::note
Lerna defers to Nx to detect task dependencies. Some options for `lerna run` behave differently than in older versions of Lerna. See [Using Lerna (Powered by Nx) to Run Tasks](docs/lerna6-obsolete-options.md) for more details on what differs from older versions of Lerna.
:::

---

## Nx Cloud

### Features

1. [Share cached task results across the organization](./features/cache-tasks#distributed-computation-caching)
2. [Distribute task execution](./features/distribute-tasks) efficiently across agent machines

### Cost

Free for open source projects

For closed source repositories, the first 500 computation hours per month are free. Most repositories do not exceed this limit. $1 per computation hour after that.

### Set up

- `npx nx connect-to-nx-cloud`
- `nx generate @nrwl/workspace:ci-workflow` (or set up your CI manually)
- Continue using Lerna as usual
