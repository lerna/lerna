---
id: alternate-bootstrapping-methods
title: "Legacy: Alternate Bootstrapping Methods"
type: explainer
---

# Legacy: Alternate Bootstrapping Methods

:::info

NOTE: Lerna's legacy package management capabilities are being deprecated in Lerna v7, [please see here for full background](../features/legacy-package-management)

:::

There are several ways Lerna can set up your monorepo such that an app (`remixapp`) can find libraries in the same repo (`header` and `footer`), and one of them is to make it such that the `header` and `footer` end up in the `node_modules` folder of `remixapp` (or a different folder at the root)--that's what `lerna bootstrap` (without `--use-workspaces`) does.

Running `lerna bootstrap` will invoke `npm install` in each of the packages, and will link local package such that the resulting structure will look like this.

```bash
lerna bootstrap
```

```
packages/
    header/
        node_modules/
            react/
            ...
        src/
            ...
        package.json
        rollup.config.json
        jest.config.js

    footer/
        node_modules/
            react/
            ...
        src/
            ...
        package.json
        rollup.config.json
        jest.config.js

    remixapp/
        node_modules/
            react/
            header (symlinked to ../../header)
            footer (symlinked to ../../footer)
            ...
        app/
            ...
        public/
        package.json
        remix.config.js

package.json
```

## Hoisting

By default, Lerna is going to run `npm install` in every directory which results in node modules duplication. You can dedupe the packages by passing `--hoist`.

```bash
lerna bootstrap --hoist
```

the following happens:

```
node_modules/
    react/
    header (symlinked to ../packages/header)
    footer (symlinked to ../packages/footer)
            ...
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

Read more about [hoisting in the corresponding guide](../concepts/hoisting).

## Linking Different Folders

By default, Lerna links the contents of the folder.

```
node_modules/
    header/
        src/
        package.json
        rollup.config.json
        jest.config.js
            ...
packages/
    header/
        src/
            ...
        package.json
        rollup.config.json
        jest.config.js
```

This happens to work if you set the main property to point to the compiler artifact, like the `header` package does.

```json title="packages/header/package.json"
{
  "name": "header",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "build": "rm -rf dist && rollup --config",
    "test": "jest"
  }
}
```

You can also link a subdirectory as follows using `lerna bootstrap --contents=dist`. The name has to apply to all the
packages.
