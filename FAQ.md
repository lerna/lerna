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

[bootstrap]: https://github.com/lerna/lerna#bootstrap
[import]: https://github.com/lerna/lerna#import
