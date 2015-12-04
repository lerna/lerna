<p align="center">
  <img alt="Lerna" src="https://i.imgur.com/yT7Skxn.png" width="480">
</p>

<p align="center">
  Tool for managing JavaScript projects with multiple packages.
</p>

## About

While developing [Babel](github.com/babel/babel) I developed a
[monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md) approach
where the entire project was split into individual packages but lived in the same repo.
This was great. It allowed super easy modularisation which meant the core was easier to
approach and meant others could use the useful parts of Babel in their applications.

This tool was abstracted out of that and deals with bootstrapping these modules by linking
them together as well as publishing them to npm. You can see th
[Babel repo](https://github.com/babel/babel/tree/master/packages) for an example of a
large Lerna project.

## Usage

```sh
$ npm install lerna --save
$ lerna bootstrap
```

### Bootstrap

```sh
$ lerna bootstrap
```

### Publishing

```sh
$ lerna publish
```

1. Publishes each module in `packages` that has been updated since the last version to npm with the tag `prerelease`.
2. Once all packages have been published. Remove the `prerelease` tags and add the tags `latest` and `stable`.

## How it works

Lerna projects operate on a single version line. The version is kept in the file `VERSION`
at the root of your project. When you run `lerna publish`, if a module has been updated
since the last time a release was made, it will be updated to the new version you're
releasing. This means that you only publish a new version of a package when you need to.
