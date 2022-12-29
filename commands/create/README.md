# `@lerna/create`

> Create a new lerna-managed package

Install [lerna](https://www.npmjs.com/package/lerna) for access to the `lerna` CLI.

## Usage

```
lerna create <name> [loc]

Create a new lerna-managed package

Positionals:
  name  The package name (including scope), which must be locally unique _and_
        publicly available                                   [string] [required]
  loc   A custom package location, defaulting to the first configured package
        location. The location must match a configured packages directory.
                                                                        [string]
```

**Note**: For more info on how Lerna package directories are configured, see https://lerna.js.org/docs/faq#how-does-lerna-detect-packages.

```
Command Options:
  --access        When using a scope, set publishConfig.access value
                             [choices: "public", "restricted"] [default: public]
  --bin           Package has an executable. Customize with --bin
                  <executableName>                             [default: <name>]
  --description   Package description                                   [string]
  --dependencies  A list of package dependencies                         [array]
  --es-module     Initialize a transpiled ES Module
  --homepage      The package homepage, defaulting to a subpath of the root
                  pkg.homepage                                          [string]
  --keywords      A list of package keywords                             [array]
  --license       The desired package license (SPDX identifier)   [default: ISC]
  --private       Make the new package private, never published
  --registry      Configure the package's publishConfig.registry        [string]
  --tag           Configure the package's publishConfig.tag             [string]
  --yes           Skip all prompts, accepting default values
```
