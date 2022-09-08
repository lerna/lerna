---
id: cache-tasks
title: Cache Task Results
type: recipe
---

# Cache Task Results

> When it comes to running tasks, caching etc., Lerna and Nx can be used interchangeably. When we say "Lerna can cache
> builds", we mean that Lerna uses Nx which can cache builds.

It's costly to rebuild and retest the same code over and over again. Lerna uses a computation cache to never rebuild the
same code twice.

:::info

To use task result caching, you must first enable nx by setting `"useNx": true` in `lerna.json`.

:::

## Setup

Lerna via Nx has the most sophisticated and battle-tested computation caching system. It knows when the task you are
about to run has been executed before, so it can use the cache to restore the results of running that task.

:::tip

If you don't have `nx.json`, run `npx nx init`.

:::

To enable caching for `build` and `test`, edit the `cacheableOperations` property in `nx.json` to include the `build` and `test` tasks:

```json title="nx.json"
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test"]
      }
    }
  }
}
```

:::info

Note, `cacheableOperations` need to be side effect free, meaning that given the same input they should always result in
the same output. As an example, e2e test runs that hit the backend API cannot be cached as the backend might influence
the result of the test run.

:::

Now, run the following command twice. The second time the operation will be instant:

```bash
lerna run test --scope=header
```

```bash title="Terminal Output"
> lerna run test --scope=header

> header:test  [existing outputs match the cache, left as is]

> header@0.1.0 test
> jest

PASS  src/Header.spec.tsx
✓ renders header (12 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.439 s, estimated 1 s
Ran all test suites.

———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

>  Lerna (powered by Nx)   Successfully ran target test for project header (4ms)

   Nx read the output from the cache instead of running the command for 1 out of 1 tasks.
```

## Advanced Caching

For a more in-depth understanding of the caching implementation and to fine-tune the caching for your repo, read [How Caching Works](../concepts/how-caching-works).

## Local Computation Caching

By default, Lerna (via Nx) uses a local computation cache. Nx stores the cached values only for a week, after which they
are deleted. To clear the cache run `nx reset`, and Nx will create a new one the next time it tries to access it.

## Distributed Computation Caching

The computation cache provided by Nx can be distributed across multiple machines. You can either build an implementation
of the cache or use Nx Cloud. Nx Cloud is an app that provides a fast and zero-config implementation of distributed
caching. It's completely free for OSS projects and for most closed-sourced
projects ([read more here](https://dev.to/nrwl/more-time-saved-for-free-with-nx-cloud-4a2j)).

You can connect your workspace to Nx Cloud by running:

```bash
npx nx connect-to-nx-cloud
```

Learn more about Nx Cloud at [https://nx.app](https://nx.app).
