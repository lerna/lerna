---
id: bootstrap
title: Bootstrap
type: explanation
---

# Bootstrap

Lerna links different projects within the repo so they can import each other without having to publish anything to NPM. To show how Lerna does it, we will take [this repository](https://github.com/lerna/getting-started-example) as an example.

The repo contains three packages or projects:

- `header` (a library of React components)
- `footer` (a library of React components)
- `remixapp` (an app written using the Remix framework which depends on both `header` and `footer`)

The Remix app imports the `header` and `footer` libraries as follows:

```typescript jsx title="packages/remixapp/app/routes/index.tsx"
import { Header } from "header";
import { Footer } from "footer";

export default function Index() {
  return (
    <>
      <Header />
      <div>Content!</div>
      <Footer />
    </>
  );
}
```

And it depends on them in its `package.json` as follows:

```json title="packages/remixapp/package.json"
{
  "dependencies": {
    "@remix-run/node": "^1.5.1",
    "@remix-run/react": "^1.5.1",
    "@remix-run/serve": "^1.5.1",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "header": "*",
    "footer": "*"
  }
}
```

To make the `header` and `footer` available inside the `remixapp`, run:

```bash
lerna bootstrap --use-workspaces
```

This installs all the dependencies needed for the 3 projects and links the `header` and `footer` projects so that `remixapp` can reference them like npm packages. `--use-workspaces` tells Lerna to delegate package linking process to your package manager. (This feature is supported by npm, yarn and pnpm.)

You can also set `useWorkspaces` as the default behavior in the `lerna.json` file:

```json title="lerna.json"
{
    ...
    "useWorkspaces": true
}
```

## Other Bootstrapping Methods

If you can't use your package manager's built in support for some reason, Lerna can handle the bootstrapping for you. There are several ways Lerna can set up your monorepo such that `remixapp` can find `header` and `footer`, and one of them is to make it such that the `header` and `footer` end up in the `node_modules` folder of `remixapp` (or a different folder at the root)--that's what `lerna bootstrap` (without `--use-workspaces`) does.

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
