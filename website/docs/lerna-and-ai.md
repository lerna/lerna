---
id: lerna-and-ai
title: Lerna and AI
type: explainer
---

# Lerna and AI

An agent dropped into your workspace can infer plenty on its own, tracing imports, package.json deps, call sites. What it cannot get cheaply or reliably is what relates to what, and that is the part your monorepo tooling already knows.

## Why monorepos work well with agents

Two things make that possible.

**Everything is in one working tree.** The agent reads the real implementation, handlers, types, shared libraries, instead of a description of them, and can modify them right away if needed.

**The graph tells it what relates to what.** Colocation alone just hands the agent a pile of files and projects, and agents are good at searching those. What they're bad at is knowing which projects matter, because they lack the dependency graph: what imports what, what breaks if this changes. The project graph fixes that.

The project graph is what makes a monorepo more than a big repo. With Lerna monorepos, agents can directly access and gather that information via the underlying [Nx graph](https://nx.dev/docs/features/explore-graph?utm_source=lerna.js.org) that powers Lerna.

## When you have multiple repositories

Many times you have multiple (mono)repos that are still related to each other (e.g. via package imports, API calls,...).

In a multi-repo setup, agents again:

- lack the knowledge of related repositories and the projects they host
- lack access to related repositories and the projects they host
- lack the ability to create coordinated changes across multiple repos (like you would in a monorepo)

[Meta-harnesses](https://metaharness.tools?utm_source=lerna.js.org) can fill in these gaps. They wrap the underlying harnesses (like Claude Code, Codex, ...) and add in the missing gaps. [Polygraph](https://trypolygraph.com?utm_source=lerna.js.org) is such a meta-harness. A unified cross-repo graph gives the agent the missing knowledge of what relates to what. Durable sessions carry that context across repos instead of resetting at each one's boundary. Shared memory is what lets separate agents in separate repos coordinate a single change, the way a monorepo commit would.
