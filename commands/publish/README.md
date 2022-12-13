# `@lerna/publish`

> Publish packages in the current project

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```sh
lerna publish              # publish packages that have changed since the last release
lerna publish from-git     # explicitly publish packages tagged in the current commit
lerna publish from-package # explicitly publish packages where the latest version is not present in the registry
```

When run, this command does one of the following things:

- Publish packages updated since the last release (calling [`lerna version`](https://github.com/lerna/lerna/tree/main/commands/version#readme) behind the scenes).
  - This is the legacy behavior of lerna 2.x
- Publish packages tagged in the current commit (`from-git`).
- Publish packages in the latest commit where the version is not present in the registry (`from-package`).
- Publish an unversioned "canary" release of packages (and their dependents) updated in the previous commit.

> Lerna will never publish packages which are marked as private (`"private": true` in the `package.json`).

During all publish operations, appropriate [lifecycle scripts](#lifecycle-scripts) are called in the root and per-package (unless disabled by [`--ignore-scripts](#--ignore-scripts)).

Check out [Per-Package Configuration](#per-package-configuration) for more details about publishing scoped packages, custom registries, and custom dist-tags.

## Positionals

### bump `from-git`

In addition to the semver keywords supported by [`lerna version`](https://github.com/lerna/lerna/tree/main/commands/version#positionals),
`lerna publish` also supports the `from-git` keyword.
This will identify packages tagged by `lerna version` and publish them to npm.
This is useful in CI scenarios where you wish to manually increment versions,
but have the package contents themselves consistently published by an automated process.

### bump `from-package`

Similar to the `from-git` keyword except the list of packages to publish is determined by inspecting each `package.json`
and determining if any package version is not present in the registry. Any versions not present in the registry will
be published.
This is useful when a previous `lerna publish` failed to publish all packages to the registry.

## Options

`lerna publish` supports all of the options provided by [`lerna version`](https://github.com/lerna/lerna/tree/main/commands/version#options) in addition to the following:

- [`--canary`](#--canary)
- [`--contents <dir>`](#--contents-dir)
- [`--dist-tag <tag>`](#--dist-tag-tag)
- [`--git-head <sha>`](#--git-head-sha)
- [`--graph-type <all|dependencies>`](#--graph-type-alldependencies)
- [`--ignore-scripts`](#--ignore-scripts)
- [`--ignore-prepublish`](#--ignore-prepublish)
- [`--legacy-auth`](#--legacy-auth)
- [`--no-git-reset`](#--no-git-reset)
- [`--no-granular-pathspec`](#--no-granular-pathspec)
- [`--verify-access`](#--verify-access)
- [`--otp`](#--otp)
- [`--preid`](#--preid)
- [`--pre-dist-tag <tag>`](#--pre-dist-tag-tag)
- [`--registry <url>`](#--registry-url)
- [`--tag-version-prefix`](#--tag-version-prefix)
- [`--temp-tag`](#--temp-tag)
- [`--yes`](#--yes)
- [`--summary-file <dir>`](#--summary-file)

### `--canary`

```sh
lerna publish --canary
# 1.0.0 => 1.0.1-alpha.0+${SHA} of packages changed since the previous commit
# a subsequent canary publish will yield 1.0.1-alpha.1+${SHA}, etc

lerna publish --canary --preid beta
# 1.0.0 => 1.0.1-beta.0+${SHA}

# The following are equivalent:
lerna publish --canary minor
lerna publish --canary preminor
# 1.0.0 => 1.1.0-alpha.0+${SHA}
```

When run with this flag, `lerna publish` publishes packages in a more granular way (per commit).
Before publishing to npm, it creates the new `version` tag by taking the current `version`, bumping it to the next _minor_ version, adding the provided meta suffix (defaults to `alpha`) and appending the current git sha (ex: `1.0.0` becomes `1.1.0-alpha.0+81e3b443`).

If you have publish canary releases from multiple active development branches in CI,
it is recommended to customize the [`--preid`](#--preid) and [`--dist-tag <tag>`](#--dist-tag-tag) on a per-branch basis to avoid clashing versions.

> The intended use case for this flag is a per commit level release or nightly release.

### `--contents <dir>`

Subdirectory to publish. Must apply to ALL packages, and MUST contain a package.json file.
Package lifecycles will still be run in the original leaf directory.
You should probably use one of those lifecycles (`prepare`, `prepublishOnly`, or `prepack`) to _create_ the subdirectory and whatnot.

If you're into unnecessarily complicated publishing, this will give you joy.

```sh
lerna publish --contents dist
# publish the "dist" subfolder of every Lerna-managed leaf package
```

**NOTE:** You should wait until the `postpublish` lifecycle phase (root or leaf) to clean up this generated subdirectory,
as the generated package.json is used during package upload (_after_ `postpack`).

### `--dist-tag <tag>`

```sh
lerna publish --dist-tag next
```

When run with this flag, `lerna publish` will publish to npm with the given npm [dist-tag](https://docs.npmjs.com/cli/dist-tag) (defaults to `latest`).

This option can be used to publish a [`prerelease`](http://carrot.is/coding/npm_prerelease) or `beta` version under a non-`latest` dist-tag, helping consumers avoid automatically upgrading to prerelease-quality code.

> Note: the `latest` tag is the one that is used when a user runs `npm install my-package`.
> To install a different tag, a user can run `npm install my-package@prerelease`.

### `--force-publish`

To be used with [`--canary`](#--canary) to publish a canary version of all packages in your monorepo. This flag can be helpful when you need to make canary releases of packages beyond what was changed in the most recent commit.

```
lerna publish --canary --force-publish
```

### `--git-head <sha>`

Explicit SHA to set as [`gitHead`](https://github.com/npm/read-package-json/blob/67f2d8d501e2621441a8235b08d589fbeeb7dba6/read-json.js#L327) on manifests when packing tarballs, only allowed with [`from-package`](#bump-from-package) positional.

For example, when publishing from AWS CodeBuild (where `git` is not available),
you could use this option to pass the appropriate [environment variable](https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-env-vars.html) to use for this package metadata:

```sh
lerna publish from-package --git-head ${CODEBUILD_RESOLVED_SOURCE_VERSION}
```

Under all other circumstances, this value is derived from a local `git` command.

### `--graph-type <all|dependencies>`

Set which kind of dependencies to use when building a package graph. The default value is `dependencies`, whereby only packages listed in the `dependencies` section of a package's `package.json` are included. Pass `all` to include both `dependencies` _and_ `devDependencies` when constructing the package graph and determining topological order.

When using traditional peer + dev dependency pairs, this option should be configured to `all` so the peers are always published before their dependents.

```sh
lerna publish --graph-type all
```

Configured via `lerna.json`:

```json
{
  "command": {
    "publish": {
      "graphType": "all"
    }
  }
}
```

### `--ignore-scripts`

When passed, this flag will disable running [lifecycle scripts](#lifecycle-scripts) during `lerna publish`.

### `--ignore-prepublish`

When passed, this flag will disable running [deprecated](https://docs.npmjs.com/misc/scripts#prepublish-and-prepare) [`prepublish` scripts](#lifecycle-scripts) during `lerna publish`.

### `--legacy-auth`

When publishing packages that require authentication but you are working with an internally hosted NPM Registry that only uses the legacy Base64 version of username:password. This is the same as the NPM publish `_auth` flag.

```sh
lerna publish --legacy-auth aGk6bW9t
```

### `--no-git-reset`

By default, `lerna publish` ensures any changes to the working tree have been reset.

To avoid this, pass `--no-git-reset`. This can be especially useful when used as part of a CI pipeline in conjunction with the `--canary` flag. For instance, the `package.json` version numbers which have been bumped may need to be used in subsequent CI pipeline steps (such as Docker builds).

```sh
lerna publish --no-git-reset
```

### `--no-granular-pathspec`

By default, `lerna publish` will attempt (if enabled) to `git checkout` _only_ the leaf package manifests that are temporarily modified during the publishing process. This yields the equivalent of `git checkout -- packages/*/package.json`, but tailored to _exactly_ what changed.

If you **know** you need different behavior, you'll understand: Pass `--no-granular-pathspec` to make the git command _literally_ `git checkout -- .`. By opting into this [pathspec](https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec), you must have all intentionally unversioned content properly ignored.

This option makes the most sense configured in lerna.json, as you really don't want to mess it up:

```json
{
  "version": "independent",
  "granularPathspec": false
}
```

The root-level configuration is intentional, as this also covers the [identically-named option in `lerna version`](https://github.com/lerna/lerna/tree/main/commands/version#--no-granular-pathspec).

### `--verify-access`

Historically, `lerna` attempted to fast-fail on authorization/authentication issues by performing some preemptive npm API requests using the given token. These days, however, there are multiple types of tokens that npm supports and they have varying levels of access rights, so there is no one-size fits all solution for this preemptive check and it is more appropriate to allow requests to npm to simply fail with appropriate errors for the given token. For this reason, the legacy `--verify-access` behavior is disabled by default and will likely be removed in a future major version.

For now, though, if you pass this flag you can opt into the legacy behavior and `lerna` will preemptively perform this verification before it attempts to publish any packages.

You should NOT use this option if:

1.  You are using a third-party registry that does not support `npm access ls-packages`
2.  You are using an authentication token without read access, such as a [npm automation access token](https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-access-tokens)

### `--otp`

When publishing packages that require two-factor authentication, you can specify a [one-time password](https://docs.npmjs.com/about-two-factor-authentication) using `--otp`:

```sh
lerna publish --otp 123456
```

> Please keep in mind that one-time passwords expire within 30 seconds of their generation. If it expires during publish operations, a prompt will request a refreshed value before continuing.

### `--preid`

Unlike the `lerna version` option of the same name, this option only applies to [`--canary`](#--canary) version calculation.

```sh
lerna publish --canary
# uses the next semantic prerelease version, e.g.
# 1.0.0 => 1.0.1-alpha.0

lerna publish --canary --preid next
# uses the next semantic prerelease version with a specific prerelease identifier, e.g.
# 1.0.0 => 1.0.1-next.0
```

When run with this flag, `lerna publish --canary` will increment `premajor`, `preminor`, `prepatch`, or `prerelease` semver
bumps using the specified [prerelease identifier](http://semver.org/#spec-item-9).

### `--pre-dist-tag <tag>`

```sh
lerna publish --pre-dist-tag next
```

Works the same as [`--dist-tag`](#--dist-tag-tag), except only applies to packages being released with a prerelease version.

### `--registry <url>`

When run with this flag, forwarded npm commands will use the specified registry for your package(s).

This is useful if you do not want to explicitly set up your registry
configuration in all of your package.json files individually when e.g. using
private registries.

### `--tag-version-prefix`

This option allows to provide custom prefix instead of the default one: `v`.

Keep in mind, if splitting `lerna version` and `lerna publish`, you need to pass it to both commands:

```bash
# locally
lerna version --tag-version-prefix=''

# on ci
lerna publish from-git --tag-version-prefix=''
```

You could also configure this at the root level of lerna.json, applying to both commands equally:

```json
{
  "tagVersionPrefix": "",
  "packages": ["packages/*"],
  "version": "independent"
}
```

### `--temp-tag`

When passed, this flag will alter the default publish process by first publishing
all changed packages to a temporary dist-tag (`lerna-temp`) and then moving the
new version(s) to the dist-tag configured by [`--dist-tag`](#--dist-tag-tag) (default `latest`).

This is not generally necessary, as Lerna will publish packages in topological
order (all dependencies before dependents) by default.

### `--yes`

```sh
lerna publish --canary --yes
# skips `Are you sure you want to publish the above changes?`
```

When run with this flag, `lerna publish` will skip all confirmation prompts.
Useful in [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to automatically answer the publish confirmation prompt.

### `--summary-file`

```sh
# Will create a summary file in the root directory, i.e. `./lerna-publish-summary.json`
lerna publish --canary --yes --summary-file
# Will create a summary file in the provided directory, i.e. `./some/other/dir/lerna-publish-summary.json`
lerna publish --canary --yes --summary-file ./some/other/dir

```

When run with this flag, a json summary report will be generated after all packages have been successfully published (see below for an example).

```json
[
  {
    "packageName": "package1",
    "version": "v1.0.1-alpha"
  },
  {
    "packageName": "package2",
    "version": "v2.0.1-alpha"
  }
]
```

## Deprecated Options

### `--no-verify-access`

The legacy preemptive access verification is now off by default, so `--no-verify-access` is not needed. Requests will fail with appropriate errors when not authorized correctly. To opt-in to the legacy access verification, use [`--verify-access`](#--verify-access).

### `--skip-npm`

Call [`lerna version`](https://github.com/lerna/lerna/tree/main/commands/version#readme) directly, instead.

## Per-Package Configuration

A leaf package can be configured with special [`publishConfig`](https://docs.npmjs.com/files/package.json#publishconfig) that in _certain_ circumstances changes the behavior of `lerna publish`.

### `publishConfig.access`

To publish packages with a scope (e.g., `@mycompany/rocks`), you must set [`access`](https://docs.npmjs.com/misc/config#access):

```json
  "publishConfig": {
    "access": "public"
  }
```

- If this field is set for a package _without_ a scope, it **will** fail.
- If you _want_ your scoped package to remain private (i.e., `"restricted"`), there is no need to set this value.

  Note that this is **not** the same as setting `"private": true` in a leaf package; if the `private` field is set, that package will _never_ be published under any circumstances.

### `publishConfig.registry`

You can customize the registry on a per-package basis by setting [`registry`](https://docs.npmjs.com/misc/config#registry):

```json
  "publishConfig": {
    "registry": "http://my-awesome-registry.com/"
  }
```

- Passing [`--registry`](#--registry-url) applies globally, and in some cases isn't what you want.

### `publishConfig.tag`

You can customize the dist-tag on a per-package basis by setting [`tag`](https://docs.npmjs.com/misc/config#tag):

```json
  "publishConfig": {
    "tag": "flippin-sweet"
  }
```

- Passing [`--dist-tag`](#--dist-tag-tag) will _overwrite_ this value.
- This value is _always_ ignored when [`--canary`](#--canary) is passed.

### `publishConfig.directory`

This _non-standard_ field allows you to customize the published subdirectory just like [`--contents`](#--contents-dir), but on a per-package basis. All other caveats of `--contents` still apply.

```json
  "publishConfig": {
    "directory": "dist"
  }
```

<a id="lifecycle-events"><!-- back-compat with previous heading --></a>

## Lifecycle Scripts

```js
// prepublish:      Run BEFORE the package is packed and published.
// prepare:         Run BEFORE the package is packed and published, AFTER prepublish, BEFORE prepublishOnly.
// prepublishOnly:  Run BEFORE the package is packed and published, ONLY on npm publish.
// prepack:     Run BEFORE a tarball is packed.
// postpack:    Run AFTER the tarball has been generated and moved to its final destination.
// publish:     Run AFTER the package is published.
// postpublish: Run AFTER the package is published.
```

Lerna will run [npm lifecycle scripts](https://docs.npmjs.com/misc/scripts#description) during `lerna publish` in the following order:

1. If versioning implicitly, run all [version lifecycle scripts](https://github.com/lerna/lerna/tree/main/commands/version#lifecycle-scripts)
2. Run `prepublish` lifecycle in root, if [enabled](#--ignore-prepublish)
3. Run `prepare` lifecycle in root
4. Run `prepublishOnly` lifecycle in root
5. Run `prepack` lifecycle in root
6. For each changed package, in topological order (all dependencies before dependents):
   1. Run `prepublish` lifecycle, if [enabled](#--ignore-prepublish)
   2. Run `prepare` lifecycle
   3. Run `prepublishOnly` lifecycle
   4. Run `prepack` lifecycle
   5. Create package tarball in temp directory via [JS API](https://github.com/lerna/lerna/tree/main/utils/pack-directory#readme)
   6. Run `postpack` lifecycle
7. Run `postpack` lifecycle in root
8. For each changed package, in topological order (all dependencies before dependents):
   1. Publish package to configured [registry](#--registry-url) via [JS API](https://github.com/lerna/lerna/tree/main/utils/npm-publish#readme)
   2. Run `publish` lifecycle
   3. Run `postpublish` lifecycle
9. Run `publish` lifecycle in root
   - To avoid recursive calls, don't use this root lifecycle to run `lerna publish`
10. Run `postpublish` lifecycle in root
11. Update temporary dist-tag to latest, if [enabled](#--temp-tag)
