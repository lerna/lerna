# Switching to Workspaces

If you are currently relying on `lerna bootstrap` or any of Lerna's other legacy package management features, then you should consider allowing Lerna to delegate this responsibility to your package manager.

Lerna recommends the use of npm/yarn/pnpm workspaces to manage dependencies. These tools will automatically link packages within the workspace to each other, simplifying development significantly and removing the need for a custom command like `lerna bootstrap`. This will all happen automatically with your package manager's `install` command. For more context on why this approach is preferred over `lerna bootstrap`, see the [legacy package management docs](../features/legacy-package-management.md).

Lerna will default to using npm workspaces for new projects. See the [getting started guide](../getting-started.md) for more information on starting fresh with Lerna.

## Converting to npm Workspaces

We will go through each of Lerna's legacy package management features and identify what it is doing, how to tell if you are using it, and what to replace it with in order to use npm workspaces instead.

:::info
If you prefer to use a different package manager, such as yarn or pnpm, then you can still use workspaces. The same concepts apply, but the configuration and commands may be slightly different. See the [yarn workspaces docs](https://yarnpkg.com/features/workspaces/) or the [pnpm workspaces docs](https://pnpm.io/workspaces) for more information.
:::

### `lerna.json` "packages"

#### What does it do?

The "packages" property in `lerna.json` was used to tell Lerna where to find packages in the workspace. This is no longer needed when using npm workspaces, as Lerna can just look at the npm workspaces configuration to determine where packages are located.

#### Where would I find it?

`lerna.json` in the root of your workspace.

#### What do I replace it with?

If it does not exist already, create a "workspaces" property in the `package.json` in the root of your workspace. Set its value equal to what the "packages" property in `lerna.json` was. The "packages" property in `lerna.json` can then be removed.

For example, if you start with these two files:

```json title="package.json"
{
  "name": "root",
  ...
}
```

```json title="lerna.json"
{
  "version": "1.0.0",
  "packages": ["packages/*"],
  ...
}
```

Then you would update them to be:

```json title="package.json"
{
  "name": "root",
  "workspaces": ["packages/*"],
  ...
}
```

```json title="lerna.json"
{
  "version": "1.0.0",
  ...
}
```

:::info
If you are using `pnpm`, you will need to create a `pnpm-workspace.yaml` file in the root of your workspace instead of adding the "workspaces" property to `package.json`. See the [pnpm workspaces docs](https://pnpm.io/workspaces) for more information. Lerna will recognize this file and use it to determine where packages are located when `npmClient` is set to `pnpm` in `lerna.json`.
:::

### `lerna bootstrap`/`lerna link`

#### What does it do?

`lerna bootstrap` was used in place of `npm install`. It would install all external npm packages and link all internal packages within the workspace. `lerna link` would just perform the internal linking step of this operation.

#### Where would I find it?

It would most likely be in the "scripts" property of `package.json` in the root of your workspace. Also check your CI pipelines, as they might also be calling `lerna bootstrap` in place of `npm install`.

#### What do I replace it with?

Replace `lerna bootstrap` with `npm install`. If you are already performing `npm install` somewhere in your workflow before where you had previously called `lerna bootstrap`, then you can just delete it instead. `lerna link` can just be removed, as the linking step is now handled by your package manager during `npm install`.

### `lerna add`

#### What does it do?

`lerna add` was used to add a dependency to packages in the workspace. It would update the `package.json` files of each package to add the dependency.

#### Where would I find it?

Though usually called manually, `lerna add` might be found in some scripts in `package.json` in the root of your workspace.

#### What do I replace it with?

`lerna add` can mostly be replaced with a variation of `npm install`. The most common use case for `lerna add` was to add a single dependency to a single package within the workspace. This command looks like:

```sh
lerna add <dependency> --scope <package>
```

and can be replaced directly with:

```sh
npm install <dependency> -w <package>
```

The `-w` flag tells npm to only install the dependency in the workspace package specified by `<package>`, similar to the `--scope` option for Lerna.

If you need to add a dependency to multiple packages, you can use the `-w` option multiple times:

```sh
npm install <dependency> -w <package1> -w <package2>
```
