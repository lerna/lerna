# FAQ

## my packages aren't linking. what's wrong?

1. packages do not get "symlink"ed as happens with `npm link`. instead, a one-liner `index.js` file get's stubbed into your package that `require`s your other dependency.

  Example:
    - suppose `A` depends on `B`, and both exist in the `<proj-root>/packages/` directory.
    - `lerna bootstrap` creates `packages/A/node_modules/B/index.js`.
      - `index.js` full contents === `require('<proj-root>/packages/B/')`

  Thus, "linking" occurs, but not in the traditional npm sense.

2. lerna will only link [caret range dependencies](https://github.com/npm/node-semver#caret-ranges-123-025-004)
  - check out the [src, here](https://github.com/kittens/lerna/blob/master/lib/commands/bootstrap/linkDependenciesForPackage.js#L49)
