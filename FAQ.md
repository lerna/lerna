# Frequently asked questions

*This document is a work in progress.*

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

[bootstrap]: https://github.com/lerna/lerna/blob/master/commands/bootstrap/README.md
[import]: https://github.com/lerna/lerna/blob/master/commands/import/README.md

## How do I retry publishing if `publish` fails?

Sometimes, `lerna publish` does not work.  Your network may have had a hiccup, you may have not been logged on to npm, etc.

If the `lerna.json` has not yet been updated, simply try `lerna publish` again.

If it has been updated, you can force re-publish.  `lerna publish --force-publish $(ls packages/)`

## The bootstrap process is really slow, what can I do?

Projects having many packages inside them could take a very long time to to bootstrap.

You can significantly reduce the time spent in `lerna bootstrap` if you turn
on hoisting, see the [hoisting docs](./doc/hoist.md) for more information.

In combination with that you may increase the bootstrap performance even more by
[using yarn as an npm client](https://github.com/lerna/lerna#--npm-client-client) instead of `npm`.

## Root `package.json`

The root `package.json`, at the very least, is how you install `lerna` locally during a CI build.
You should also put there your testing, linting and similar tasks there to run them from root
as running them separately from each package is slower. The root can also hold all the "hoisted" packages,
which speeds up bootstrapping when using the [`--hoist`][hoist] flag.

You can add the root as a managed location (in the `packages` array of `lerna.json`) - if that's something you need.
This would cause lerna to link root's dependencies to your packages' directories, run `postinstall` script along with the others, etc.

[hoist]: https://github.com/lerna/lerna/blob/master/doc/hoist.md

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
