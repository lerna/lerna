# @lerna/legacy-package-management

This package contains the legacy `lerna add`, `lerna bootstrap` and `lerna link` commands which deal with things better handled by your package manager `npm`/`yarn`/`pnpm`.

This package can be thought of as being in maintenance mode only - no new features will be considered for legacy package management concerns, and we will only look to merge critical patches and security updates.

See below for full context as to why this exists.

## Background

Lerna is the original monorepo/workspace tool in the JavaScript ecosystem. When it was created in 2015/2016 the ecosystem looked totally different, and there were no built in capabilities to handle working with multiple packages in a single repository (a "workspace"). Commands like `lerna bootstrap`, `lerna add` and `lerna link` were all a critical part of the lerna project, because there were no other options.

However, now that we find ourselves in 2023, the fact is that - for many years now - the package managers we know and love (`npm`, `yarn` and `pnpm`) all fully support that concept of workspaces as a first-class use-case.

They have battle tested implementations covering adding, removing and linking local packages, and combining them with third party dependencies in a natural way.

This is the reason why, for the past several _years_ of his tenure as lead maintainer of Lerna @evocateur has been encouraging folks to strongly reconsider their use of the legacy package management commands in lerna, and instead leverage their package manager of choice to do what it does best.

We on the Nx Team knew about this context from afar, but as new stewards of the project we did not want to jump straight in and start removing capabilities without first taking the time to get familiar with the reality up close. Now that we have been actively maintaining the project for half a year, we are in full agreement with Daniel and others that the legacy package management commands in lerna need to be retired.

By removing these legacy pieces which have _better_ alternatives natively in package managers, we and the rest of the lerna community will be freed up to concentrate our efforts on things which are uniquely valuable about lerna (such as, but not limited to, versioning and publishing), and making them the best they can be!

We of course want to make sure that folks who are perhaps less aware of the modern capabilities of their package manager are not left confused by this change, so we will be building out comprehensive migration guides on https://lerna.js.org to help them transition their thinking from a legacy lerna command to its equivalent for `npm`, `yarn` or `pnpm`.
