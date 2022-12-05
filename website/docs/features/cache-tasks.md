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

## Setup

Lerna via Nx has the most sophisticated and battle-tested computation caching system. It knows when the task you are
about to run has been executed before, so it can use the cache to restore the results of running that task.

:::tip

If you don't have `nx.json`, run `npx lerna add-caching`.

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
lerna run build --scope=header
```

```bash title="Terminal Output"
> lerna run build --scope=header

> header:build  [existing outputs match the cache, left as is]

> header@0.0.0 build
> rimraf dist && rollup --config


src/index.tsx → dist...
created dist in 858ms

 —————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

>  Lerna (powered by Nx)   Successfully ran target test for project header (4ms)

   Nx read the output from the cache instead of running the command for 1 out of 1 tasks.
```

## Replaying from Cache

When Lerna determines that the inputs for a task have not changed, it recreates the outputs of that task as if it actually ran on your machine - but much faster. The outputs of a cached task include both the terminal output and the files created in the defined `output` directories for that task.

You can test this out by deleting the `dist` folder that the `header:build` task outputs to and then running `lerna run build --scope=header` again. The cached task will replay instantly and the correct files will be present in the `dist` folder.

```treeview
header/
└── dist/  <-- this folder gets recreated
```

If your task creates output artifacts in a different location, you can [change the output folder(s)](https://nx.dev/reference/project-configuration#outputs) that are cached. You can also [customize which inputs](https://nx.dev/more-concepts/customizing-inputs) will invalidate the cache if they are changed.

## Advanced Caching

For a more in-depth understanding of the caching implementation and to fine-tune the caching for your repo, read [How Caching Works](../concepts/how-caching-works).

## Local Computation Caching

By default, Lerna (via Nx) uses a local computation cache. Nx stores the cached values only for a week, after which they
are deleted. To clear the cache run `nx reset`, and Nx will create a new one the next time it tries to access it.
