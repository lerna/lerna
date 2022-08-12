# Using pnpm with Lerna

Lerna can be used in a [`pnpm` workspace](https://pnpm.io/workspaces) to get the full benefits of both [`pnpm`](https://pnpm.io) and Lerna.

When used in a `pnpm` workspace, Lerna will:

- resolve package locations with `pnpm-workspace.yaml` (https://pnpm.io/workspaces)
- enforce `useWorkspaces: true` in `lerna.json` (and ignore `packages:` in `package.json`).
- block usage of `bootstrap`, `link`, and `add` commands. Instead, you should use `pnpm` commands directly to manage dependencies (https://pnpm.io/cli/install).
- respect the [workspace protocol](https://pnpm.io/workspaces#workspace-protocol-workspace) for package dependencies.
  - During `lerna version`, dependencies will be updated as normal, but will preserve the `workspace:` prefix if it exists.
  - If a [workspace alias](https://pnpm.io/workspaces#referencing-workspace-packages-through-aliases) is used, then `lerna version` will not bump the version of the dependency, since aliases don't specify a version number to bump.

## Getting Started

To set up pnpm with Lerna:

1. If not installed already, install `pnpm`: https://pnpm.io/installation.
2. Remove the `node_modules/` folder in the root, if it exists. If not already using workspaces, run `lerna clean` to remove the `node_modules/` folder in all packages.
3. Set `"npmClient": "pnpm"` and `"useWorkspaces": true` in `lerna.json`.
4. Create a `pnpm-workspace.yaml` file in the root of your project.
   If you are already using npm or yarn workspaces, move the "workspaces" property from `package.json` to `pnpm-workspace.yaml`. If you were not already using workspaces, move the "packages" property from `lerna.json` to `pnpm-workspace.yaml`. For example:

   ```json title="package.json"
   {
     "workspaces": ["packages/*"]
   }
   ```

   and

   ```json title="lerna.json"
   {
     "packages": ["packages/*"]
   }
   ```

   become:

   ```yaml title="pnpm-workspace.yaml"
   packages:
     - "packages/*"
   ```

5. (optional) Run `pnpm import` to generate a `pnpm-lock.yaml` file from an existing lockfile. See https://pnpm.io/cli/import for supported lockfile sources.
6. Run `pnpm install`.
