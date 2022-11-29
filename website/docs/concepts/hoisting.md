---
id: hoisting
title: "Legacy: Hoisting"
type: explainer
---

# Legacy: Hoisting

:::info

NOTE: Lerna's legacy package management capabilities are being deprecated in Lerna v7, [please see here for full background](../features/legacy-package-management)

:::


```bash
lerna bootstrap --hoist
```

> Use caution when enabling this feature, as certain configurations can cause problems.
> When an overall project is divided into more than one NPM package, this
> organizational improvement generally comes with a cost: the various
> packages often have many duplicate dependencies in their `package.json`
> files, and as a result hundreds or thousands of duplicated files in
> various `node_modules` directories. By making it easier to manage a
> project comprised of many NPM packages, Lerna can inadvertently
> exacerbate this problem.

Fortunately, Lerna also offers a feature to improve the situation -
Lerna can reduce the time and space requirements for numerous copies of
packages in development and build environments, by "hoisting"
dependencies up to the topmost, Lerna-project-level `node_modules`
directory instead.

`--hoist` is intended to be transparent in use, a runtime optimization
that ideally does not require any other modifications to a project.
When the `--hoist` flag is used:

- Common dependencies will be installed _only_ to the top-level
  `node_modules`, and omitted from individual package `node_modules`.
- Mostly-common dependencies are still hoisted, but outlier packages
  with different versions will get a normal, local `node_modules`
  installation of the necessary dependencies.
  - In this instance, `lerna bootstrap` will always use `npm install`
    with the `--global-style` flag, regardless of client configuration.
- Binaries from those common packages are symlinked to individual
  package `node_modules/.bin` directories, so that `package.json`
  scripts continue to work unmodified.
- Well-behaved Node-based software should continue to work unmodified.

## Disadvantages with hoisting

### Module resolution

The [Node module resolution algorithm](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders)
is recursive: When looking for package `A`, it looks in a local
`node_modules/A` directory, then in `../node_modules/A`,
`../../node_modules/A`, `../../../node_modules/A`, etc.

Tooling that follows this specification can transparently find
dependencies which have been hoisted.

Unfortunately, some tooling does not follow the module resolution spec
closely, and instead assumes or requires that dependencies are present
specifically in the local `node_modules` directory. To work around
this, it is possible to symlink packages from their hoisted top-level
location, to individual package `node_modules` directory. Lerna does
not yet do this automatically, and it is recommended instead to work
with tool maintainers to migrate to more compatible patterns.

### Forgetting dependencies

Lerna will hoist dependencies which are used in multiple projects,
even if they are not used in all projects.

As a result, your packages will be able to import or require any of
the dependencies that have been hoisted, even if you _forgot to
specify that dependency_ in your package's `package.json` file.

Tests will pass fine, and you may not realise until later, when you
try to use this package outside the monorepo, that some of its
dependencies are missing.

(This problem is not specific to lerna. It can also occur as a result
of [`npm`'s flattening](https://medium.com/pnpm/pnpms-strictness-helps-to-avoid-silly-bugs-9a15fb306308).)

To avoid this problem, we can use the [eslint-plugin-import](https://github.com/benmosher/eslint-plugin-import)
package, which has a rule `no-extraneous-dependencies` that can warn
when an import is made from an unspecified package. It is enabled by
default in the 'recommended' config. Otherwise, we should check by
hand that all new imports come from packages specified in
`package.json`.
