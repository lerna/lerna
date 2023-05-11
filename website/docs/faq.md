---
id: faq
title: FAQ
type: recipe
---

# Frequently asked questions

_This document is a work in progress._

## How do I add a package to my Lerna repository?

You should not need to ever run `npm install` from within a package directory. If you are using npm workspaces, then you should run `npm install` from the root. If `useWorkspaces` is `false` or missing within `lerna.json`, then you will need to use Lerna's [legacy package management functions](./features/legacy-package-management.md) to properly link packages.

### New packages

New packages can be added to your Lerna repository using the `lerna create` command:

```sh
lerna create <package>
```

See the [create docs](https://github.com/lerna/lerna/tree/main/libs/commands/create#readme) for more options.

If you don't want to use `lerna create`, then you can still manually create a package by running `npm init` within a subdirectory of the `packages` folder and Lerna will automatically detect it.

### Existing packages

You can use [`lerna import <package>`][import] to transfer an existing package
into your Lerna repository; this command will preserve the commit history.

[`lerna import <package>`][import] takes a local path rather than a URL. In this
case you will need to have the repo you wish to link to on your file system.

[import]: https://github.com/lerna/lerna/blob/main/libs/commands/import/README.md

## How do I retry publishing if `publish` fails?

In the case that some packages were successfully published and others were not, `lerna publish` may have left the repository in an inconsistent state with some changed files. To recover from this, reset any extraneous local changes from the failed run to get back to a clean working tree. Then, retry the same `lerna publish` command. Lerna will attempt to publish all of the packages again, but will recognize those that have already been published and skip over them with a warning.

If you used the `lerna publish` command without positional arguments to select a new version for the packages, then you can run `lerna publish from-git` to retry publishing that same already-tagged version instead of having to bump the version again while retrying.

## Root `package.json`

The root `package.json`, at the very least, is how you install `lerna` locally during a CI build.
You should also put your testing, linting and similar tasks there to run them from root
as running them separately from each package is slower.

## How does Lerna detect packages?

By default, Lerna uses the `workspaces` property in `package.json` to search for packages. For details on this property, see the [npm documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#workspaces) or the [Yarn documentation](https://classic.yarnpkg.com/lang/en/docs/workspaces/).

If you are using `pnpm`, you might have set `npmClient` to `pnpm` in `lerna.json`. In this case, Lerna will use the `packages` property in `pnpm-workspace.yaml` to search for packages. For details on this property, see the [pnpm documentation](https://pnpm.io/workspaces).

If you are using an older version of Lerna or have explicitly opted out of using workspaces, then Lerna will use the `packages` property in `lerna.json` to search for packages.
