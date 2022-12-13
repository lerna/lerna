---
id: introduction
title: Introduction
type: explainer
---

# Introduction

Lerna is the original [monorepo tool](https://monorepo.tools) for TypeScript/JavaScript. It has been around for many years and is used by tens of thousands of projects, including React and Jest.

It solves three of the biggest problems of JavaScript monorepos:

- Lerna links different projects within the repo, so they can import each other without having to publish anything to NPM.
- Lerna runs a command against any number of projects, and it does it in the most efficient way, in the right order, and with the possibility to distribute that on multiple machines.
- Lerna manages your publishing process, from version management to publishing to NPM, and it provides a variety of options to make sure any workflow can be accommodated.

Nrwl (the company behind the open source build system Nx) has taken over [stewardship of Lerna](https://dev.to/nrwl/lerna-is-dead-long-live-lerna-3jal). [Nx](https://nx.dev) is a build system developed by ex-Googlers and utilizes many of the techniques used by internal Google tools. Lerna v5 is the first release under this new stewardship, updating outdated packages and starting to do some cleanup on the repository itself. Starting with v6+, Lerna delegates task scheduling work to Nx's battle tested, industry-leading task runner, meaning `lerna run` gets the benefits of caching and command distribution for free!

## Why Lerna?

- **Super Fast!** Lerna is fast, even faster than most comparable solutions out there ([see this benchmark](https://github.com/vsavkin/large-monorepo) to learn more). How? Under the hood, [Lerna v6+ uses Nx to run tasks](https://twitter.com/i/status/1529493314621145090). Learn more about [running tasks here](./features/run-tasks.md).
- **Computation Caching** - Lerna knows when the task you are about to run has been executed in the past. Instead of running it, Lerna will restore the files and replay the terminal output instantly. Plus, this cache can be shared with your co-workers and CI. When using Lerna, your whole organization will never have to build or test the same thing twice. [Read more &raquo;](./features/cache-tasks.md)
- **Configuration-Free Distributed Task Execution** Lerna can distribute any command across multiple machines without any configuration, while preserving the dev ergonomics of running it on a single machine. In other words, scaling your monorepo with Lerna is as simple as enabling a boolean flag. See the examples of how enabling DTE can make you CI 20 times faster. [Read more &raquo;](./features/distribute-tasks.md)
- **Beautiful Terminal Output** Monorepos can have hundreds or thousands of projects. Printing everything on every command makes it hard to see what fails and why. Thankfully, Lerna does a much better job.
- **Powerful Graph Visualizer** Lerna comes with a powerful interactive visualizer simplifying the understanding of your workspaces. [Read more &raquo;](/docs/getting-started#visualizing-workspace)
- **Publishing to NPM** Lerna is the ultimate tool for publishing multiple packages to npm. Whether the packages have independent versions or not, Lerna has you covered. [Read more &raquo;](./features/version-and-publish.md)
- **Easy to Adopt** Even with all these capabilities, Lerna is very easy to adopt. It requires close-to-zero configurations. [Want to see how?](/docs/getting-started)
