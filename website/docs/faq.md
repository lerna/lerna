---
id: faq
title: FAQ
type: recipe
---

# Frequently asked questions

_This document is a work in progress._

## How do I add a third party dependency to my Lerna repository?

Lerna is not responsible for adding or linking your dependencies, that is what your package manager of choice (`npm`/`yarn`/`pnpm`) is best at. By using the `workspaces` feature of your package manager, all the linking of local packages will happen automatically based on the relationships you set up in your `package.json` files.

You can check out the `workspaces` documentation for your package manager here:

- `npm` (https://docs.npmjs.com/cli/using-npm/workspaces)
- `yarn` (https://yarnpkg.com/features/workspaces)
- `pnpm` (https://pnpm.io/workspaces)

NOTE: Because lerna itself predates the `workspaces` feature in package managers, there was historically a few commands (`add`, `bootstrap` and `link`) that attempted to fill that gap. Fortunately these commands are no longer needed and lerna can focus on what it does best and let the package managers does the same.

### New packages within the lerna repo

You can use the [`lerna create`](https://github.com/lerna/lerna/tree/main/libs/commands/create#readme) command to create new packages within your lerna repo.

```sh
lerna create <packageName>
```

See the [create docs](https://github.com/lerna/lerna/tree/main/libs/commands/create#readme) for more options.

If you don't want to use `lerna create`, then you can still manually create a package by running `npm init` within a subdirectory of the `packages` folder and Lerna will automatically detect it.

### Existing packages

You can use [`lerna import <package>`][import] to transfer an existing package
into your Lerna repository; this command will preserve the commit history.

[`lerna import <package>`][import] takes a local path rather than a URL. In this
case you will need to have the repo you wish to link to on your file system.

[bootstrap]: https://github.com/lerna/lerna/blob/main/libs/commands/bootstrap/README.md
[import]: https://github.com/lerna/lerna/blob/main/libs/commands/import/README.md

## How do I retry publishing if `publish` fails?

In the case that some packages were successfully published and others were not, lerna publish may have left the repository in an inconsistent state with some changed files. To recover from this, reset any extraneous local changes from the failed run to get back to a clean working tree. Then, retry the same lerna publish command. Lerna will attempt to publish all of the packages again, but will recognize those that have already been published and skip over them with a warning.

If you used the lerna publish command without positional arguments to select a new version for the packages, then you can run lerna publish from-git to retry publishing that same already-tagged version instead of having to bump the version again while retrying.

## How does Lerna detect packages?

By default, for `npm` and `yarn`, lerna uses the configured `workspaces` property in `package.json` to know what packages to operate on. For details on this property, see the [npm documentation](https://docs.npmjs.com/cli/using-npm/workspaces) or the [yarn documentation](https://yarnpkg.com/features/workspaces).

If you are using `pnpm`, you might have set `npmClient` to `pnpm` in `lerna.json`. In this case, Lerna will use the `packages` property in `pnpm-workspace.yaml` to know what packages to operate on. For details on this property, see the [pnpm documentation](https://pnpm.io/workspaces).

If you want lerna to focus on a particular subset of packages in your repo, you can leverage the `packages` property in `lerna.json` to search for packages.
