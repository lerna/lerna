---
id: legacy-package-management
title: Legacy Package Management
type: recipe
---

# Legacy Package Management

## Background

Lerna is the original monorepo/workspace tool in the JavaScript ecosystem. When it was created in 2015/2016 the ecosystem looked totally different, and there were no built in capabilities to handle working with multiple packages in a single repository (a "workspace"). Commands like lerna bootstrap, lerna add and lerna link were all a critical part of the lerna project, because there were no other options.

However, now that we find ourselves in late 2022, the fact is that - for many years now - the package managers we know and love (`npm`, `yarn` and `pnpm`) all fully support that concept of workspaces as a first-class use-case.

They have battle tested implementations covering adding, removing and linking local packages, and combining them with third party dependencies in a natural way.

This is the reason why, for the past several years of his tenure as lead maintainer of Lerna, Daniel, has been encouraging folks to strongly reconsider their use of the legacy package management commands in lerna, and instead leverage their package manager of choice to do what it does best.

We knew about this context from afar, but as new stewards of the project we did not want to jump straight in and start removing capabilities without first taking the time to get familiar with the reality up close. Now that we have been actively maintaining the project for half a year, we are in full agreement with Daniel and others that the legacy package management commands in lerna need to be retired.

By removing these legacy pieces which have better alternatives natively in package managers, we and the rest of the lerna community will be freed up to concentrate our efforts on things which are uniquely valuable about lerna (such as, but not limited to, versioning and publishing), and making them the best they can be!

From version 7, therefore, we will no longer ship the legacy package management commands (such as lerna bootstrap, lerna add and lerna link) by default with lerna, and instead make them available as an add-on via a separate package - `@lerna/legacy-package-management`.

This new package can be thought of as being in maintenance mode only - no new features will be considered for legacy package management concerns (such as lerna bootstrap, lerna add and lerna link), and we will only look to merge critical patches and security updates.

:::info

This same context is covered on the [Lerna v7 discussion](https://github.com/lerna/lerna/discussions/3410), if you have any specific concerns, please join us there and provide as much information as possible!

:::

### Legacy Bootstrap Command

For details on how use Lerna's legacy bootstrapping functionality, see [Alternate Legacy Bootstrapping Methods](../concepts/alternate-bootstrapping-methods).
