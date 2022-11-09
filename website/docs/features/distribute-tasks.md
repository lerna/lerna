---
id: distribute-tasks
title: Distribute Task Execution
type: recipe
---

# Distribute Task Execution (DTE)

Lerna (via Nx) supports running commands across multiple machines. You can either set it up by hand (by using batching or binning) or use Nx Cloud.

[Read the comparison of the two approaches.](https://blog.nrwl.io/distributing-ci-binning-and-distributed-task-execution-632fe31a8953?source=friends_link&sk=5120b7ff982730854ed22becfe7a640a)

## Set up

To distribute your task execution, you need to (1) connect to Nx Cloud and (2) enable DTE in your CI workflow.  Each of these steps can be enabled with a single command:

```bash title="1. Connect to Nx Cloud"
nx connect-to-nx-cloud
```

``` bash title="2. Enable DTE in CI"
nx generate @nrwl/workspace:ci-workflow --ci=github
```

The `--ci` flag can be `github`, `circleci` or `azure`.  For more details on setting up DTE, read [this guide](https://nx.dev/nx-cloud/set-up/set-up-dte).

## CI Execution Flow

There are two main parts to the CI set up:

1. The main job that controls what is going to be executed
2. The agent jobs that actually execute the tasks

The main job execution flow looks like this:

```yml
    # Coordinate the agents to run the tasks
    - npx nx-cloud start-ci-run
    # Run any commands you want here
    - nx affected --target=lint
    - nx affected --target=test
    - nx affected --target=build
    # Stop any run away agents
    - npx nx-cloud stop-all-agents
```

The agent job execution flow is very simple:

```yml
    # Wait for tasks to execute
    - npx nx-cloud start-agent
```

## Illustrated Guide

For more details about how distributed task execution works, check out the [illustrated guide](../concepts/dte-guide) by Nrwlian [Nicole Oliver](https://twitter.com/nixcodes).

[![how does distributed task execution work in Nx Cloud?](../images/dte/how-does-dte-work.jpeg)](../concepts/dte-guide)

