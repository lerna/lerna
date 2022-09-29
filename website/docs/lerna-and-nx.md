---
id: lerna-and-nx
title: Lerna and Nx
type: explainer
---

# Lerna and Nx

Nrwl (the company behind the open source build system Nx) has taken over [stewardship of Lerna](https://dev.to/nrwl/lerna-is-dead-long-live-lerna-3jal). [Nx](https://nx.dev) is a build system developed by ex-Googlers and utilizes many of the techniques used by internal Google tools. Lerna v5 is the first release under this new stewardship, updating outdated packages and starting to do some cleanup on the repository itself. Starting with v5.1+, Lerna comes with the new possibility to integrate Nx and defer a lot of the task scheduling work to it.

The following is a high level overview of what each tool provides. Note that all of the existing Lerna commands will continue to function as they have. Adding Nx or Nx Cloud simply improves what you're already doing.

## Lerna

### Features

1. [Bootstrap](./features/bootstrap) - Link packages together in the same repo so they can be imported as if they were installed from NPM.
2. [Version](./features/version-and-publish) - Automatically increment versions of packages
3. [Publish](./features/version-and-publish) - Automatically create tags and publish packages

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
5. [Nx Console](./features/project-graph) - Visual Studio Code plugin

### Cost

Free and open source

### Set up

- `npm install nx`
- `npx nx init`
- Set `"useNx": true` in `lerna.json`
- Continue using Lerna as usual

:::note
When Lerna is set to use Nx and detects `nx.json` with `targetDefaults` in the workspace, it will defer to Nx to detect task dependencies. Some options for `lerna run` will behave differently. See [Using Lerna (Powered by Nx) to Run Tasks](./recipes/using-lerna-powered-by-nx-to-run-tasks) for more details.
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
