---
id: run-tasks
title: Run Tasks
---

# Run Tasks

Monorepos can have hundreds or even thousands of projects, so being able to run npm scripts against all (or some) of
them is a key feature of a tool like Lerna.

## Definitions

- **Command -** anything the developer types into the terminal (e.g., `lerna run build --scope=header --concurrency=5`).
- **Target -** the name of an npm script (e.g., `build`)
- **Task -** an invocation of an npm script (e.g., `header:build`).

## Example Repository

> Examples are based on [this repository](https://github.com/lerna/getting-started-example), so feel free to clone it
> and follow along.

## Run Everything

Each project has the `test` and `build` scripts defined.

Run:

```bash
npx lerna run build
```

This will build the projects in the right order: `footer` and `header` and then `remixapp`.

```bash title="Terminal Output"
    ✔  header:build (501ms)
    ✔  footer:build (503ms)
    ✔  remixapp:build (670ms)

 —————————————————————————————————————————————————————————————————————————————

 >  Lerna (powered by Nx)   Successfully ran target build for 3 projects (1s)

```

Note that Lerna doesn't care what each of the build scripts does. The name `build` is also **not** special: it's simply
the name of the npm script.

Lerna delegates the running of npm scripts (forking processes etc) to Nx. The `nx.json` file is the place where you can
configure how Nx does it.

:::tip

If you don't have `nx.json`, run `npx nx init`.

:::

If you want to increase the number of processes running the scripts to, say, 5 (by default, it is 3), pass the
following:

```bash
npx lerna run build --concurrency=5
```

Note, you can also change the default in `nx.json`, like this:

```json title="nx.json"
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [],
        "parallel": 5
      }
    }
  }
}
```

## Run Specific Tasks

While developing you rarely run all the builds or all the tests. Instead, you often run things only against the projects
you are changing. For instance, you can run the `header` tests like this:

```bash
npx lerna run test --scope=header
```

You can also run a command for all the projects affected in your PR like this:

```bash
npx lerna run test --since=origin/main
```

Learn more [here](../api-reference/filter-options.md).


## Allow Tasks to Run in Any Order

To run the `test` script for each of the projects, run the following:

```bash
npx lerna run test --no-sort
```

You should see the following output:

```bash title="Terminal Output"
    ✔  footer:test (1s)
    ✔  header:test (1s)
    ✔  remixapp:test (236ms)

 ——————————————————————————————————————————————————————————————————————————————

 >  Lerna (powered by Nx)   Successfully ran target test for 3 projects (1s)
```

Note that we are passing `--no-sort` to tell Lerna that tasks can run in any order.

## Define Task Dependencies (aka Task Pipelines)

Without our help Lerna cannot know what targets (scripts) require order and which don't. That's why you can
pass `--sort` and `--no-sort`, but this isn't the best way to go about it.

If builds have to run in the topological order, they **always** have to run in that order; otherwise things will be broken. On the other hand, if tests can run in any order, it never make sense to run them in topological order. That would only make them slower.

A better way to do it is to tell Lerna how targets relate. Add the following to `nx.json`:

```json title="nx.json"
{
  ...
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

With this, Lerna knows that before it can build a project, it needs to build all of its dependencies first. There are,
however, no constraints on tests.

> Once you define the `targetDefaults` property the sort flag is ignored.

This mechanism is very flexible. Let's look at this example:

```json title="nx.json"
{
  ...
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build", "prebuild"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

> Note, older versions of Nx used targetDependencies instead of targetDefaults. Both still work, but targetDefaults is
> recommended.

When running `lerna run test --scope=myproj`, the above configuration would tell Lerna to

1. Run the `test` command for `myproj`
2. But since there's a dependency defined from `test -> build` (see `test:["build"]`), Lerna runs `build` for `myproj`
   first.
3. `build` itself defines a dependency on `prebuild` (on the same project) as well as `build` of all the dependencies.
   Therefore, it will run the `prebuild` script and will run the `build` script for all the dependencies.

Note, Lerna doesn't have to run all builds before it starts running tests. The task orchestrator will run as many tasks
in parallel as possible as long as the constraints are met.

Situations like this are pretty common:

![Mixing Targets](../images/running-tasks/mixing-targets.png)

Because we described the rules in `nx.json`, they will apply to all the projects in the repo. You can also define
project-specific rules by adding them the project's `package.json`.

```json
{
  ...
  "nx": {
    "targets": {
      "test": {
        "dependsOn": [
          "build"
        ]
      }
    }
  }
}
```

## Cache Task Results

Lerna via Nx has the most sophisticated and battle-tested computation caching system. It knows when the task you are
about to run has been executed before, so it can use the cache to restore the results of running that task.

We previously adjusted the `cacheableOperations` in `nx.json` to include the `build` and `test` tasks. If you don't have
that yet, add them now:

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
