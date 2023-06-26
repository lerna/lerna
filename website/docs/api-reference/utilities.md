---
id: utilities
title: Utilities
type: reference
---

# Utilities

Lerna ships some utility functions that can be used in creating your own tools within a Lerna monorepo.

```js
const utils = require("lerna/utils");
```

## `detectProjects()`

The `detectProjects()` function creates the same project graph file mapping that Lerna uses under the covers to execute its commands. This is useful for writing your own scripts that need to operate on the same set of packages that Lerna would.

```js
const { detectProjects } = require("lerna/utils");

const { projectGraph, projectFileMap } = await detectProjects();
```

The `projectGraph` that is returned will be a `ProjectGraphWithPackages`, which is an extension of the `ProjectGraph` type from `@nx/devkit`. It contains additional metadata about projects that have `package.json` files. It also has a `localPackageDependencies` property that tracks internal npm dependencies between projects (as opposed to external npm dependencies that are downloaded from the registry).

The `projectFileMap` is a mapping of project names to the files within them. This is used to determine which project needs to be versioned when a file changes.

See [Lerna's TypeScript source code](https://github.com/lerna/lerna/blob/main/libs/core/src/lib/project-graph-with-packages.ts) for specific type details.
