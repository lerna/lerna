---
id: task-pipeline-configuration
title: Task Pipeline Configuration
type: explainer
---

# Task Pipeline Configuration

Lerna delegates the running of npm scripts (forking processes etc) to Nx. The `nx.json` file is the place where you can
configure how Nx does it.

:::tip

If you don't have `nx.json`, run `npx lerna add-caching`.

:::

## Run Tasks in Parallel

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

## Define Task Dependencies (aka Task Pipelines)

Without our help Lerna cannot know what targets (scripts) have prerequisites and which ones don't. You can define task dependencies in the `nx.json` file:

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

The `^` symbol (a.k.a the caret symbol) simply means dependencies. Therefore whereas `"test": { "dependsOn": ["build"] }` means a particular project's "test" target depends on its own "build" target to have already completed before running, `"build": { "dependsOn": ["^build"] }` means that a particular project's "build" target depends on the "build" target of all of the project's dependencies to have already completed before running.

When running `lerna run test --scope=myproj`, the above configuration would tell Lerna to

1. Run the `test` command for `myproj`
2. But since there's a dependency defined from `test -> build`, Lerna runs `build` for `myproj` first.
3. `build` itself defines a dependency on `prebuild` (on the same project) as well as `build` of all the dependencies.
   Therefore, it will run the `prebuild` script and will run the `build` script for all the dependencies.

Note, Lerna doesn't have to run all builds before it starts running tests. The task orchestrator will run as many tasks
in parallel as possible as long as the constraints are met.

Situations like this are pretty common:

![Mixing Targets](../images/running-tasks/task-graph-execution.svg)

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
