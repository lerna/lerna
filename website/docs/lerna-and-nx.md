---
id: lerna-and-nx
title: Lerna and Nx
type: explainer
---

# Lerna and Nx

[Nx](https://nx.dev) took over [stewardship of Lerna](https://dev.to/nrwl/lerna-is-dead-long-live-lerna-3jal) in 2022 after it was at risk of being unmaintained.

[Nx](https://nx.dev) is an open-source MIT-licensed build system developed by ex-Googlers and utilizes many of the techniques used by internal Google tools. Lerna uses Nx to detect packages in the workspace and dependencies between them. Lerna defers to Nx's powerful task runner to run scripts, allowing you to run them in parallel, cache results, and distribute them across multiple machines, all while ensuring that dependencies between packages are respected. For a complete list of which Lerna versions are compatible with which Nx versions, see the [Lerna and Nx Version Matrix](./lerna-and-nx-version-matrix).

Lerna workspaces can also be connected to [Nx Cloud](https://nx.dev/nx-cloud?utm_source=lerna.js.org) for free to enable [distributed task execution and remote caching](./features/distribute-tasks).
