---
id: faq
title: FAQ
type: recipe
---

# Frequently asked questions

_This document is a work in progress._

## How do I add a package to my Lerna repository?

For any packages that you add to your Lerna repository, instead of running
`npm install` you should run [`lerna bootstrap`][bootstrap]. This will take into
account the existing projects in the `packages` folder as well as
external dependencies.

### New packages

Create a directory for your package in the `packages` folder, and run `npm init`
as normal to create the `package.json` for your new package.

### Existing packages

You can use [`lerna import <package>`][import] to transfer an existing package
into your Lerna repository; this command will preserve the commit history.

[`lerna import <package>`][import] takes a local path rather than a URL. In this
case you will need to have the repo you wish to link to on your file system.

[bootstrap]: https://github.com/lerna/lerna/blob/main/libs/commands/bootstrap/README.md
[import]: https://github.com/lerna/lerna/blob/main/libs/commands/import/README.md

## How do I retry publishing if `publish` fails?

Sometimes, `lerna publish` does not work. Your network may have had a hiccup, you may have not been logged on to npm, etc.

If the `lerna.json` has not yet been updated, simply try `lerna publish` again.

If it has been updated, you can force re-publish. `lerna publish --force-publish $(ls packages/)`

### Recovering from a network error

In the case that some packages were successfully published and others were not, `lerna publish` may have left the repository in an inconsistent state with some changed files. To recover from this, reset any extraneous local changes from the failed run to get back to a clean working tree. Then, retry the same `lerna publish` command. Lerna will attempt to publish all of the packages again, but will recognize those that have already been published and skip over them with a warning.

If you used the `lerna publish` command without positional arguments to select a new version for the packages, then you can run `lerna publish from-git` to retry publishing that same already-tagged version instead of having to bump the version again while retrying.

## The bootstrap process is really slow, what can I do?

Projects having many packages inside them could take a very long time to bootstrap.

You can significantly reduce the time spent in `lerna bootstrap` if you turn
on hoisting, see the [hoisting docs](./concepts/hoisting) for more information.

In combination with that you may increase the bootstrap performance even more by
[using yarn as an npm client](https://github.com/lerna/lerna/blob/main/libs/commands/bootstrap/README.md#usage) instead of `npm`.

## Root `package.json`

The root `package.json`, at the very least, is how you install `lerna` locally during a CI build.
You should also put your testing, linting and similar tasks there to run them from root
as running them separately from each package is slower. The root can also hold all the "hoisted" packages,
which speeds up bootstrapping when using the [`--hoist`][hoist] flag.

[hoist]: https://github.com/lerna/lerna/blob/main/doc/hoist.md

## CI setup

As mentioned above root `package.json` is responsible for installing `lerna` locally. You need to automate `bootstrap` though.
This can be achieved by putting it as npm script to use it during CI phases.

Example root `package.json`:

```json
{
  "name": "my-monorepo",
  "private": true,
  "devDependencies": {
    "eslint": "^3.19.0",
    "jest": "^20.0.4",
    "lerna": "^2.0.0"
  },
  "scripts": {
    "bootstrap": "lerna bootstrap --hoist",
    "pretest": "eslint packages",
    "test": "jest"
  }
}
```

Example CircleCI's configuration file (`circle.yml`):

```yml
dependencies:
  post:
    - npm run bootstrap
```

## How does Lerna detect packages?

By default, Lerna uses the `workspaces` property in `package.json` to search for packages. For details on this property, see the [npm documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#workspaces) or the [Yarn documentation](https://classic.yarnpkg.com/lang/en/docs/workspaces/).

If you are using `pnpm`, you might have set `npmClient` to `pnpm` in `lerna.json`. In this case, Lerna will use the `packages` property in `pnpm-workspace.yaml` to search for packages. For details on this property, see the [pnpm documentation](https://pnpm.io/workspaces).

If you are using an older version of Lerna or have explicitly opted out of using workspaces, then Lerna will use the `packages` property in `lerna.json` to search for packages.
