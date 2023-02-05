---
id: run-tasks
title: Run Tasks
type: explainer
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

## Run a Multiple Tasks concurrently

You can pass a comma-delimited list of targets you wish to trigger to run concurrently.

```bash
npx lerna run test,build,lint
```

If, for example, there are dependencies between your tasks, such as `build` needing to run before `test` for particular packages, the task-runner will coordinate that for you as long as you have configured an appropriate [Task Pipeline Configuration](../concepts/task-pipeline-configuration).

## Run a Task for a single Package

While developing you rarely run all the builds or all the tests. Instead, you often run things only against the projects
you are changing. For instance, you can run the `header` tests like this:

```bash
npx lerna run test --scope=header
```

## Run Tasks Affected by a PR

You can also run a command for all the projects affected in your PR like this:

```bash
npx lerna run test --since=origin/main
```

Learn more [here](../api-reference/commands).

## Control How Tasks Run

For more control over the order tasks are executed, edit the [Task Pipeline Configuration](../concepts/task-pipeline-configuration).

To speed up your task execution, learn how to [Cache Task Results](./cache-tasks) and [Distribute Task Execution](./distribute-tasks)

## Automatic loading of .env files

By default the modern task runner powered by Nx will automatically load `.env` files for you. You can set `--load-env-files` to false if you want to disable this behavior for any reason.

For more details about what `.env` files will be loaded by default please see: https://nx.dev/recipes/environment-variables/define-environment-variables
