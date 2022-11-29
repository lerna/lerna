---
id: getting-started
title: Getting Started
type: tutorial
---

# Getting Started

<iframe width="560" height="315" src="https://www.youtube.com/embed/1oxFYphTS4Y" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>

You can incrementally adopt Lerna for existing monorepos or create a new Lerna workspace by running:

```bash
npx lerna init
```

All Lerna functionality will work the same way regardless.

This tutorial will give you an introduction to Lerna's features. To get started with the tutorial, clone [this repository](https://github.com/lerna/getting-started-example). The `main` branch contains the final setup. If you want to follow along, please checkout the `prelerna` branch.

```bash
git clone https://github.com/lerna/getting-started-example.git
cd getting-started-example
git checkout prelerna
npm install
```

The repo contains three packages or projects:

- `header` (a library of React components)
- `footer` (a library of React components)
- `remixapp` (an app written using the Remix framework which depends on both `header` and `footer`)

```
packages/
    header/
        src/
            ...
        package.json
        rollup.config.json
        jest.config.js

    footer/
        src/
            ...
        package.json
        rollup.config.json
        jest.config.js

    remixapp/
        app/
            ...
        public/
        package.json
        remix.config.js

package.json
```

## Adding Lerna

To add Lerna run the following command:

```bash
npx lerna@latest init
```

This will

- add `lerna` to the root `package.json`
- generate a `lerna.json`
- configure a npm/yarn/pnpm workspace

```json title="package.json"
{
  "name": "root",
  "private": true,
  "workspaces": ["packages/*"],
  "devDependencies": {
    "lerna": "6.0.1"
  }
}
```

What makes Lerna 5.1+ so powerful is the task delegation and other features that come with its integration
with [Nx](https://nx.dev).

## Package Dependency Management

When running `lerna init`, Lerna configures the workspace to use NPM/YARN/PNPM workspaces, the built-in solution for local referencing of packages. In this tutorial, in particular, we are leveraging [NPM workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

:::info

Lerna has historically its own dependency management solution: `lerna bootstrap`. This was required because at the time when Lerna was first released, there were no native solutions available. Nowadays the modern package managers come with a built-in "workspaces" solution, so it is highly recommended to go with that instead. `lerna bootstrap` and other related commands will be officially deprecated in Lerna v7. See https://github.com/lerna/lerna/discussions/3410
:::

You can see this configured in the root-level `package.json` `workspaces` property as well as by having `useWorkspaces` set to `true` in `lerna.json`

```json title="package.json"
{
  "name": "root",
  ...
  "workspaces": [
    "packages/*"
  ],
  ...
}
```

To see how it works, let's for example inspect the `package.json` file of `remixapp`.

```json title="packages/remixapp/package.json"
{
  ...
  "dependencies": {
    ...
    "header": "*",
    "footer": "*"
  }
}
```

The `"header": "*"` and `"footer": "*"` tell Lerna to link the contents of the `header` and `footer` as if they were published to the registry. Make sure to run:

```bash
npm install
```

Now all the projects in the workspace can properly reference each other via local package linking.

## Visualizing the Workspace

Since Lerna is powered by Nx, you can use its capabilities to open an interactive visualization of the workspace project graph.

To open the visualization, run:

```bash
npx nx graph
```

![Project Graph](./images/getting-started/project-graph.png)

## Building All Projects

To build all projects, run

```bash
npx lerna run build
```

This builds the three projects in the right order: `header` and `footer` will be built first (and in parallel),
and `remixapp` will be built after. The order matters because the `remixapp` uses the bundles from the compiled `header`
and `footer`.

```
    ✔  header:build (501ms)
    ✔  footer:build (503ms)
    ✔  remixapp:build (670ms)

 —————————————————————————————————————————————————————————————————————————————

 >  Lerna (powered by Nx)   Successfully ran target build for 3 projects (1s)

```

## Testing All Projects

Now, let's run the tests.

```bash
npx lerna run test
```

You should see the following output:

```
    ✔  footer:test (1s)
    ✔  header:test (1s)
    ✔  remixapp:test (236ms)

—————————————————————————————————————————————————————————————————

 >  Lerna (powered by Nx)   Successfully ran target test for 3 projects (1s)
```

Note, `lerna` will run the three `test` npm scripts in the topological order as well. Although we had to do it when
building, it isn't necessary for tests (and it also makes the command slower). We can change this behavior by configuring caching.

## Caching

Running any command right now will execute all the tasks, every time, even when nothing changes. We can fix it by adding
a bit of configuration.

First, let's run

```bash
npx lerna add-caching
```

A series of questions will be asked to properly configure the workspace:

```bash
? Which scripts need to be run in order? (e.g. before building a project, dependent projects must be built.)
 (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
❯◉ build
 ◯ test
 ◯ dev
 ◯ start
```

```bash
? Which scripts are cacheable? (Produce the same output given the same input, e.g. build, test and lint usually are, serve and start are not.)
 (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
 ◉ build
❯◉ test
 ◯ dev
 ◯ start
```

```bash
? Does the "build" script create any outputs? If not, leave blank, otherwise provide a path relative to a project root (e.g. dist, lib, build,
coverage)
 dist
? Does the "test" script create any outputs? If not, leave blank, otherwise provide a path relative to a project root (e.g. dist, lib, build,
coverage)
```

A `nx.json` gets generated at the root of your workspace:

```json title="nx.json"
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

This configuration caches `build` and `test` tasks and forces `build` to run in topological order (but `test` will not). Also each project's `dist` folder defaults to being cached as the `build` output.

Now, let's run tests on the header project twice. The second time the operation will be instant:

```bash
npx lerna run test --scope=header
```

```
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

—————————————————————————————————————————————————————————————————

>  Lerna (powered by Nx)   Successfully ran target test for project header (4ms)

   Nx read the output from the cache instead of running the command for 1 out of 1 tasks.
```

Lerna was able to recognize that the same command has already executed against the same relevant code and environment. As a result, instead of running the command, Lerna restored the necessary files and replayed the terminal output.

Caching not only restores the terminal output logs, but also artifacts that might have been produced. Build all the projects, then remove the remix build folder and run the build command again.

```bash
npx lerna run build
rm -rf packages/remixapp/public/build
```

You will see all the files restored from cache and the command executing instantly.

```
    ✔  header:build  [existing outputs match the cache, left as is]
    ✔  footer:build  [existing outputs match the cache, left as is]
    ✔  remixapp:build  [local cache]

 ——————————————————————————————————————————————————————————————————————————————

 >  Lerna (powered by Nx)   Successfully ran target build for 3 projects (19ms)

    Nx read the output from the cache instead of running the command for 3 out of 3 tasks.
```

Lerna automatically recognizes most common output directories (e.g. `dist`, `build`,...) and captures their content in the cache. As we have seen, we can also customize that output directory, by defining it either globally in the `nx.json` (see the example further up), or on a per project basis in the corresponding `package.json`.

We can for example fine-tune the configuration of our Remix application by configuring the Remix-specific output path's in the `package.json`:

```json title="packages/remixapp/package.json"
{
  "name": "remixapp",
  ...
  "dependencies": {...},
  "devDependencies": {...},
  "nx": {
    "targets": {
      "build": {
        "outputs": ["{projectRoot}/build", "{projectRoot}/public/build"]
      }
    }
  }
}
```

:::note

`{projectRoot}` is a special syntax supported by the task-runner, which will be appropriately interpolated internally when the command runs. You should therefore not replace "{projectRoot}" with a fixed path as this makes your configuration less flexible.

:::

Lerna also supports [distributed caching](./features/cache-tasks.md) and [config-free distributed task execution](./features/distribute-tasks.md).

## Target Dependencies (aka task pipelines)

We have made good progress, but there is one problem left to be solved. The following configuration in `nx.json` is incomplete:

```json title="nx.json"
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

This ensures that `build` dependencies are run before any `build` command, but we also need to remember to build `header` and `footer` before we run `lerna run dev --scope=remixapp`. We can fix that by defining dependencies between targets (also known as task pipelines) in the `nx.json`:

```json title="nx.json"
{
  ...
  "targetDefaults": {
    "build": {
      "dependsOn": [
        "^build"
      ]
    },
    "dev": {
      "dependsOn": [
        "^build"
      ]
    }
  }
}
```

With this change:

- `npx lerna run build` will run the build targets in the right order.
- `npx lerna run dev --scope=remixapp` will run the build targets for `header` and `footer` first and then run the dev
  target for `remixapp`.
- `npx lerna run test` will run all the three test targets in parallel.

If you are wondering whether it is slow to run `lerna run dev --scope=remixapp` given that you have to rebuild all the
dependencies all the time, the answer is "no". The dependencies will be rebuilt only when they change. Otherwise,
their dist folders will be kept as is.

## Publishing

Finally, let's talk about the third key Lerna feature: publishing to npm. Lerna comes already with a `publish` command
built-in. To publish our packages `header` and `footer`, all we need to do is to run:

```bash
npx lerna publish --no-private
```

This will

- determine the current version of the packages
- detect which packages have changed since the last publishing & then update its version in `package.json` accordingly
- create a commit of the changed `package.json` files, tag the commit and push the tag & commit to the remote
- publish the packages to NPM

Read more about the publishing and versioning
process [in the corresponding docs page](./features/version-and-publish.md).
