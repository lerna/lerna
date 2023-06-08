---
id: configuring-published-files
title: Configuring Published Files
type: explainer
---

# Configuring Published Files

When publishing a package to a registry, the default is to publish everything in the package's source directory. This is not always optimal, since there are often files only relevant for development, such as tests and configuration files, and it could be that you first compile your source files and output them to a centralized location in a monorepo setup.

Lerna provides a number of configuration options to ensure that only the appropriate files are packed and published to a registry.

## `"files"` and .gitignore

Lerna always publishes using npm's tooling, and it has a few built in ways to include or exclude files. The easiest way to configure which files are included in the published package are via the "files" property in `package.json` and `.gitignore`. See the [npm documentation](https://docs.npmjs.com/cli/v7/commands/npm-publish#files-included-in-package) for more information on how npm recognizes files for publishing.

## `--contents` [legacy -> prefer `--directory`]

A number of commands, including `lerna publish`, support a generalized `--contents` option, which sets the directory to publish for ALL packages.

This is only useful for publishing if the packages in your monorepo have a simplistic, uniform output structure. The argument passed to `--contents` must be a subdirectory that exists within every package being published. See the [lerna publish documentation](https://github.com/lerna/lerna/tree/main/libs/commands/publish#--contents-dir) for details.

In v7, we introduced a more powerful, more focused `--directory` option for `lerna publish`. Please prefer that over the `--contents` option, which will likely be deprecated in future.

## `--directory"`

In v7, we introduced a more powerful, more focused `--directory` option for `lerna publish`.

It can be configured in your `lerna.json` and supports using the following dynamic placeholders: `{workspaceRoot}`, `{projectRoot}`, `{projectName}`. These values will be dynamically replaced at publish time.

This means you can now succinctly express setups which are uniform in terms of their style, but not literally identical across all packages.

For example, let's say we have a monorepo where we build all packages and their outputs are set to go to a centralized location (as is common in Nx workspaces, for example):

We have `packages/package-a` which writes its build output to `dist/packages/package-a`, and `packages/package-b` which writes its build output to `dist/packages/package-b`.

Even though the paths are strictly different, we have a consistent approach we can now express using the placeholders:

`{workspaceRoot}/dist/{projectRoot}`

`{workspaceRoot}` will be replaced by the absolute path to our lerna repo, and `{projectRoot}` will be replace by `packages/package-a` in the case of `package-a`, and `packages/package-b` in the case of `package-b`.

The way we apply that in the `lerna.json` is as follows:

```json
// lerna.json
{
  "version": "1.0.0",
  "command": {
    "publish": {
      "directory": "{workspaceRoot}/dist/{projectRoot}"
    }
  }
}
```

You can also set or override the publish directory option within a package's `package.json`, if you need to something completely custom for that particular package.

An example configuration for a package that publishes from a `dist/packages/foo` folder in the root of the repo:

```json
// packages/foo/package.json
{
  "name": "foo",
  "version": "1.0.0",
  "lerna": {
    "command": {
      "publish": {
        "directory": "../../dist/packages/foo"
      }
    }
  }
}
```

If you wanted to make one of your packages behave like a standard lerna package and publish from source, you could override its publish config like so:

```json
// packages/foo/package.json
{
  "name": "foo",
  "version": "1.0.0",
  "lerna": {
    "command": {
      "publish": {
        "directory": ".",
        "assets": []
      }
    }
  }
}
```

# Including Additional Assets in Published Packages

Lerna can copy files from your source directory to the directory specified for publishing. Just as with the `directory` option, this can be configured in the `lerna.json` (including using dynamic placeholders within asset definitions), or within the `package.json` of a particular package.

By default, Lerna will copy the `README.md` and `package.json` files. If you decided to override the `assets` configuration, you must make sure to include `"package.json"` in your asset definitions.

Regardless of which file it is configured in, the `"assets"` property should be an array of glob patterns or objects with a `"from"` and `"to"` property. The `"from"` property should be a specific file or glob pattern that matches files in the source directory, and the `"to"` property is the path to copy the file to within the publish directory.

This example package builds its output to a root `dist/packages/bar` directory. Lerna is configured to copy additional files to this directory, then publish the contents of `dist/packages/bar` to npm.

```json
// packages/bar/package.json
{
  "name": "bar",
  "version": "1.0.0",
  "lerna": {
    "command": {
      "publish": {
        "directory": "../../dist/packages/bar",
        "assets": [
          "README.md",
          "package.json",
          "docs/*.md",
          {
            "from": "static/images/*",
            "to": "assets"
          },
          {
            "from": "../../CONTRIBUTING.md",
            "to": "./"
          }
        ]
      }
    }
  }
}
```

Lerna will consume the above configuration and copy the appropriate files to the dist directory, producing a structure like this:

```
dist/packages/bar
├── assets
│   ├── my-image-1.png
│   └── my-image-2.png
├── CONTRIBUTING.md
├── docs
│   ├── my-doc-1.md
│   └── my-doc-2.md
├── package.json
└── README.md
```
