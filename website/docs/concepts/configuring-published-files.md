---
id: configuring-published-files
title: Configuring Published Files
type: explainer
---

# Configuring Published Files

When publishing a package to npm, the default is to publish everything in the package's source directory. This is not always optimal, since there are often files only relevant for development, such as tests and configuration files. There are a few ways to ensure that only the appropriate files are packed and published to npm.

## `"files"` and .gitignore

Lerna always publishes using npm, and npm has a few built in ways to include or exclude files. The easiest way to configure which files are included in the published package are via the "files" property in `package.json` and `.gitignore`. See the [npm documentation](https://docs.npmjs.com/cli/v7/commands/npm-publish#files-included-in-package) for more information on how npm recognizes files for publishing.

## `--contents`

`lerna publish` has a `--contents` options, which sets the directory to publish for ALL packages. This is useful if the packages in your monorepo have a uniform output structure. The argument passed to `--contents` must be a subdirectory that exists within every package being published. See the [lerna publish documentation](https://github.com/lerna/lerna/tree/main/libs/commands/publish#--contents-dir) for details.

## `"lerna.publish.directory"` property in `package.json`

The `"lerna.publish.directory"` property in `package.json` can be used to configure the directory to publish for a specific package. This is useful if the packages in your monorepo have different output structures, or if your packages' build output is in a folder outside of its source directory. This is the most flexible way to configure which files are published for each package.

An example configuration for a package that builds to a `dist/packages/foo` folder in the root of the repo:

```json
// packages/foo/package.json
{
  "name": "foo",
  "version": "1.0.0",
  "lerna": {
    "publish": {
      "directory": "../../dist/packages/foo"
    }
  }
}
```

[This example repo](https://github.com/fahslaj/lerna-custom-publish-directory) shows how to use this approach to configure the files to publish for packages that transpile TypeScript files to JavaScript output in a `dist` folder in the root of the repo.

# Including Additional Assets in Published Packages

Lerna can copy files from your source directory to the directory specified for publishing. By default, Lerna will copy the `README.md` and `package.json` files. This can be configured via the `"lerna.publish.assets"` property in `package.json` to include additional files or exclude the default files.

The `"assets"` property should be an array of globs or objects with a `"from"` and `"to"` property. The `"from"` property should be a specific file or glob pattern that matches files in the source directory, and the `"to"` property is the path to copy the file to in the publish directory.

This example configuration is taken from [an example repo](https://github.com/fahslaj/lerna-custom-publish-directory). The package builds its output to a root `dist/packages/bar` directory. Lerna is configured to copy additional files to this directory, then publish the contents of `dist/packages/bar` to npm.

```json
// packages/bar/package.json
{
  "name": "bar",
  "version": "1.0.0",
  "lerna": {
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
