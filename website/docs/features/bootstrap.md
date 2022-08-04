---
id: bootstrap
title: Bootstrap
type: recipe
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

Bootstrapping this way should work for most people, but you can use [Alternate Bootstrapping Methods](../concepts/alternate-bootstrapping-methods) if needed.
