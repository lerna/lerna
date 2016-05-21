<p align="center">
  <img alt="Lerna" src="https://cloud.githubusercontent.com/assets/952783/15271604/6da94f96-1a06-11e6-8b04-dc3171f79a90.png" width="480">
</p>

<p align="center">
  A tool for managing JavaScript projects with multiple packages.
</p>

<p align="center">
  <a href="https://travis-ci.org/lerna/lerna"><img alt="Travis Status" src="https://img.shields.io/travis/lerna/lerna/master.svg?style=flat&label=travis"></a>
  <a href="https://slack.lernajs.io/"><img alt="Slack Status" src="https://slack.lernajs.io/badge.svg"></a>
</p>

## About

While developing [Babel](https://github.com/babel/babel) I followed a
[monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md) approach
where the entire project was split into individual packages but everything lived in the same
repo. This was great. It allowed super easy modularisation which meant the core was easier
to approach and meant others could use the useful parts of Babel in their own projects.

This tool was abstracted out of that and deals with bootstrapping packages by linking
them together as well as publishing them to npm. You can see the
[Babel repo](https://github.com/babel/babel/tree/master/packages) for an example of a
large Lerna project.

> We are in the process of updating the docs to 2.x right now. Although the commands are the same, the docs below are mainly for 1.x (which is the version you get with a default `npm install`).

## Usage

```sh
$ npm install -g lerna
$ lerna bootstrap
```

This will create a dummy `VERSION` file as well as a `packages` folder.

### Bootstrap

```sh
$ lerna bootstrap
```

1. Link together all packages that depend on each other.
2. `npm install` all other dependencies of each package.

### Updated

```sh
$ lerna updated
```

1. Check which `packages` have changed since the last release, and log it.

### Publishing

```sh
$ lerna publish
```

1. Publish each module in `packages` that has been updated since the last version to npm with the tag `prerelease`.
2. Once all packages have been published, remove the `prerelease` tags and add the tags `latest` and `stable`.

> If you need to publish prerelease versions, set an env variable. `NPM_DIST_TAG=next lerna publish`.
> This will add the tag you specify instead of `latest` and `stable`.

## How it works

Lerna projects operate on a single version line. The version is kept in the file `VERSION`
at the root of your project. When you run `lerna publish`, if a module has been updated
since the last time a release was made, it will be updated to the new version you're
releasing. This means that you only publish a new version of a package when you need to.
