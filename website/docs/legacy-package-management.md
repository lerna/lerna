---
id: legacy-package-management
title: Legacy Package Management
type: explainer
---

# Legacy Package Management

## Migrating from `lerna bootstrap`, `lerna add` and `lerna link` in lerna v7 and later

In lerna v7.0.0, we removed the `lerna bootstrap`, `lerna add` and `lerna link` commands in lerna by default.

This section covers how best to migrate away from using them and modernize your setup using package manager `workspaces`. For full context on _why_ this necessary, see [Background](#background) below.

The important mental shift is to recognize that lerna is not responsible for installing and linking your dependencies in your repo, your package manager is much better suited to that task.

The way to achieve this is by using your package manager's `workspaces` feature. See their respective documentation here:

- `npm` (https://docs.npmjs.com/cli/using-npm/workspaces)
- `yarn` (https://yarnpkg.com/features/workspaces)
- `pnpm` (https://pnpm.io/workspaces)

By using `workspaces`, your package manager will perform the same exact linking that `lerna bootstrap` and `lerna link` were doing for you before, except it is baked right into the `install` command. No additional commands after running an install are necessary (as long as you have `workspaces` configured per the package manager documentation above).

The same thing goes for replacing `lerna add`. Adding and removing dependencies is something your package manager already does for you, and because `workspaces` is a first class use case, you can run an appropriate `install` command to add a dependency to a specific package/workspace and, again, all the relevant local linking will take place automatically.

### Custom Hoisting

One of the nice things about lerna's legacy `bootstrap` command was the control it offered you around hoisting or not hoisting certain dependencies up to the root of the repo, or leaving them in nested locations.

Therefore you may be concerned about migrating away from `lerna bootstrap` if you have quite a custom setup in terms of package hoisting.

In our experience of testing out the various package managers, we have found that modern `yarn` (i.e. v3 and later) offers the most flexibility in terms of hoisting controls:

https://yarnpkg.com/configuration/yarnrc/#nmHoistingLimits

We have yet to find a `lerna bootstrap` powered repo, no matter the hoisting complexities, that could not be converted to modern yarn, so please try it out if this applies to you.

If you were just using `lerna bootstrap` without any advanced hoisting concerns, feel free to choose from any of the package managers, they all offer robust `workspaces` implementations.

### Temporarily polyfilling legacy package management commands

If you really find yourself stuck and needing the legacy package management commands of `lerna bootstrap`, `lerna add` and `lerna link` in v7, you can install the `@lerna/legacy-package-management` package at the same version as your `lerna` package, and this will polyfill the commands with their old implementations.

It's important to note that this is just a stop gap and this new package can be thought of as being in maintenance mode only - no new features will be considered for legacy package management concerns (such as `lerna bootstrap`, `lerna add` and `lerna link`), and we will only look to merge critical patches and security updates.

If you find yourself in this position, please open an issue on the lerna repo so that we can learn more about the difficulties you are facing and help you find a way forward:

https://github.com/lerna/lerna/issues/new/choose

## Background

Lerna is the original monorepo/workspace tool in the JavaScript ecosystem. When it was created in 2015/2016 the ecosystem looked totally different, and there were no built in capabilities to handle working with multiple packages in a single repository (a "workspace"). Commands like `lerna bootstrap`, `lerna add` and `lerna link` were all a critical part of the lerna project, because there were no other options.

However, the fact is that - for many years now - the package managers we know and love (`npm`, `yarn` and `pnpm`) all fully support that concept of workspaces as a first-class use-case.

They have battle tested implementations covering adding, removing and linking local packages, and combining them with third party dependencies in a natural way.

This is the reason why, for the final several years of his tenure as lead maintainer of lerna, Daniel, had been encouraging folks to strongly reconsider their use of the legacy package management commands in lerna, and instead leverage their package manager of choice to do what it does best.

We knew about this context from afar, but as new stewards of the project in 2022 we did not want to jump straight in and start removing capabilities without first taking the time to get familiar with the reality up close. Now that we have been actively maintaining for a while, we are in full agreement with Daniel and others that the legacy package management commands in lerna needed to be retired.

By removing these legacy pieces which have better alternatives natively in package managers, we and the rest of the lerna community are now freed up to concentrate our efforts on things which are uniquely valuable about lerna (such as, but not limited to, versioning and publishing), and making them the best they can be!

:::info

This same context is covered on the [Lerna v7 discussion](https://github.com/lerna/lerna/discussions/3410), if you have any specific concerns, please join us there and provide as much information as possible!

:::
