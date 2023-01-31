---
id: version-and-publish
title: Version and Publish
type: explainer
---

# Version and Publish

Lerna can increment your package's versions as well as publish your packages to NPM, and it provides a variety of options to make sure any workflow can be accommodated.

To show how Lerna does it, we will look at [this repository](https://github.com/lerna/getting-started-example).

> If you learn better by doing, clone the repo and follow along.

The repo contains three packages or projects:

- `header` (a library of React components)
- `footer` (a library of React components)
- `remixapp` (an app written using the Remix framework which depends on both `header` and `footer`)

We are going to publish the `header` and the `footer` packages.

> It's common to publish only a subset of the projects. Some projects can be private (e.g., used only for tests), some
> can be demo apps. In this repo, `remixapp` isn't private, it just doesn't get published to NPM.

## Versioning

Lerna comes with a `version` command that allows you to increment your package's version number, commit the changes and tag them accordingly.

```bash
lerna version --no-private
```

you'll get the following output:

```bash
lerna notice cli v5.1.2
lerna info current version 1.0.0
lerna info Assuming all packages changed
? Select a new version (currently 1.0.0) (Use arrow keys)
❯ Patch (1.0.1)
  Minor (1.1.0)
  Major (2.0.0)
  Prepatch (1.0.1-alpha.0)
  Preminor (1.1.0-alpha.0)
  Premajor (2.0.0-alpha.0)
  Custom Prerelease
  Custom Version
```

:::info
Note that by passing `--no-private` we exclude all packages that are marked `private` in their `package.json` file.
:::

Lerna detects the current packages, identifies the current version and proposes the next one to choose. Note, you can also pass a semver bump directly like `lerna version 1.0.0`. More on the [version docs details](https://github.com/lerna/lerna/tree/main/libs/commands/version#readme). Once a given version is chosen, Lerna updates the `package.json` with the version number, commits the change, adds a corresponding version tag (e.g. `v1.0.0`) and pushes the commit and the tag to the remote repository.

```json title="packages/footer/package.json"
{
  "name": "footer",
  "version": "1.0.1",
  "main": "dist/index.js",
  ...
}
```

Note the above operation does not push the package to any NPM repository. If instead we also want Lerna to take care of the publishing process, we can use `lerna publish` instead.

:::info
Lerna uses the `version` property in `lerna.json` to determine the currently used version
:::

## Publishing to NPM

If we run

```bash
lerna publish --no-private
```

Lerna executes the version incrementing workflow (same as `lerna version`) and in addition also pushes the packages to NPM. You should get the following output:

```bash title="Terminal Output"
lerna notice cli v5.1.2
lerna info current version 1.0.0
lerna info Assuming all packages changed
? Select a new version (currently 1.0.0) Patch (1.0.1)

Changes:
 - footer: 1.0.0 => 1.0.1
 - header: 1.0.0 => 1.0.1

? Are you sure you want to publish these packages? Yes
lerna info execute Skipping releases
lerna info git Pushing tags...
lerna info publish Publishing packages to npm...
...
lerna success published header 1.0.1
...
lerna success published footer 1.0.1
...
Successfully published:
 - footer@1.0.1
 - header@1.0.1
lerna success published 2 packages
```

## Versioning strategies

Lerna allows you to manage your project using one of two modes: Fixed or Independent.

### Fixed/Locked mode (default)

Fixed mode Lerna projects operate on a single version line. The version is kept in the `lerna.json` file at the root of your project under the `version` key. When you run `lerna publish`, if a module has been updated since the last time a release was made, it will be updated to the new version you're releasing. This means that you only publish a new version of a package when you need to.

> Note: If you have a major version zero, all updates are [considered breaking](https://semver.org/#spec-item-4). Because of that, running `lerna publish` with a major version zero and choosing any non-prerelease version number will cause new versions to be published for all packages, even if not all packages have changed since the last release.

Use this if you want to automatically tie all package versions together. One issue with this approach is that a major change in any package will result in all packages having a new major version.

### Independent mode

`npx lerna init --independent`

Independent mode Lerna projects allows maintainers to increment package versions independently of each other. Each time you publish, you will get a prompt for each package that has changed to specify if it's a patch, minor, major or custom change.

Independent mode allows you to more specifically update versions for each package and makes sense for a group of components. Combining this mode with something like [semantic-release](https://github.com/semantic-release/semantic-release) would make it less painful. (There is work on this already at [atlassian/lerna-semantic-release](https://github.com/atlassian/lerna-semantic-release)).

> Set the `version` key in `lerna.json` to `independent` to run in independent mode.
