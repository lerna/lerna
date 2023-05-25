---
id: getting-started
title: Getting Started
type: tutorial
---

# Getting Started

Lerna comes with a dedicated `init` command to assist you with both adding lerna to an existing repo, or creating one from scratch.

## Starting from scratch

In the simplest case, `lerna init` can be used to create a new repository in an empty directory. For that, we can run the following commands:

```bash
# Create an empty directory
mkdir ./new-lerna-workspace
# Change into the new directory
cd ./new-lerna-workspace
# Initialize lerna (using --dryRun to preview the changes)
npx lerna init --dryRun
```

Note that we have passed the `--dryRun` flag here, this allows us to see a preview of the changes that `lerna init` will make to our file system. This allows us to tweak the values of any other arguments we pass to `lerna init` (such as `--exact` or `--independent`) without having to worry about undoing any mistakes.

Once we are happy with the changes it will make, we can simply repeat the `npx lerna init` command but leave off the `--dryRun` flag.

You will now be up and running with a working git repository, including npm workspaces, with lerna available to create, version and publish any packages you wish to develop.

## Adding lerna to an existing repo

If you already have an existing repo, you can still add `lerna` to it using `lerna init`.

:::info
**Lerna is not responsible for installing and linking your dependencies** in your repo, your package manager is much better suited to that task.

Instead, we strongly recommend configuring your package manager of choice to use its `workspaces` feature:

- `npm` (https://docs.npmjs.com/cli/using-npm/workspaces)
- `yarn` (https://yarnpkg.com/features/workspaces)
- `pnpm` (https://pnpm.io/workspaces)

:::

When initializing lerna on an existing repo, it will need a way to know what packages it should operate on. If you are using your package manager's `workspaces` feature (see note above), then lerna will default to using the `workspaces` patterns you have already configured. No extra arguments are required.

Alternatively, you can manually specify a set of patterns to match against instead by using the `--packages` flag for `lerna init`:

```bash
# Passing a single pattern
npx lerna init --packages="packages/*"
# Passing multiple patterns
npx lerna init --packages="foo/*" --packages="bar/*"
```
